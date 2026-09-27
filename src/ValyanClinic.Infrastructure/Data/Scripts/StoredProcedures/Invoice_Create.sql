SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Invoice_Create — emite factura unei consultații finalizate (idempotent).
-- * Numărul se alocă sub lock pe rândul seriei, în aceeași tranzacție cu insert-ul:
--   la rollback contorul revine, deci numerotarea nu are goluri.
-- * Liniile = snapshot din serviciile consultației. Liniile introduse manual
--   (@Lines) sunt permise doar pe factura de corecție, după o stornare.
-- * CNP-ul se citește din fișa pacientului doar la cerere explicită (@IncludeCnp).
-- * Consultația trece în FACTURATA.
-- Result: InvoiceId, IsDuplicate
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Invoice_Create
    @ClinicId                    UNIQUEIDENTIFIER,
    @ConsultationId              UNIQUEIDENTIFIER,
    @IdempotencyKey              UNIQUEIDENTIFIER,
    @SeriesId                    UNIQUEIDENTIFIER = NULL,
    @CustomerIsLegalEntity       BIT,
    @CustomerName                NVARCHAR(200),
    @IncludeCnp                  BIT              = 0,
    @CustomerFiscalCode          NVARCHAR(20)     = NULL,
    @CustomerTradeRegisterNumber NVARCHAR(30)     = NULL,
    @CustomerAddress             NVARCHAR(500)    = NULL,
    @CustomerCity                NVARCHAR(100)    = NULL,
    @CustomerCounty              NVARCHAR(100)    = NULL,
    @Lines                       dbo.InvoiceLineInputTableType READONLY,
    @CreatedBy                   UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @ExistingId UNIQUEIDENTIFIER;
        SELECT @ExistingId = Id
        FROM dbo.Invoices WITH (UPDLOCK, HOLDLOCK)
        WHERE ClinicId = @ClinicId AND IdempotencyKey = @IdempotencyKey;

        IF @ExistingId IS NOT NULL
        BEGIN
            COMMIT TRANSACTION;
            SELECT @ExistingId AS InvoiceId, CAST(1 AS BIT) AS IsDuplicate;
            RETURN;
        END;

        DECLARE @PatientId UNIQUEIDENTIFIER, @StatusCode NVARCHAR(50);
        SELECT @PatientId = c.PatientId, @StatusCode = s.Code
        FROM dbo.Consultations c WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND c.IsDeleted = 0;

        IF @PatientId IS NULL
        BEGIN
            ;THROW 50020, N'Consultația nu a fost găsită.', 1;
        END;

        IF @StatusCode NOT IN (N'FINALIZATA', N'FACTURATA')
        BEGIN
            ;THROW 50600, N'Consultația trebuie finalizată înainte de facturare.', 1;
        END;

        DECLARE @IssuedStatusId UNIQUEIDENTIFIER = (SELECT Id FROM dbo.InvoiceStatuses WHERE Code = N'EMISA');
        DECLARE @ActiveInvoice NVARCHAR(50) = (
            SELECT TOP (1) CONCAT(Series, N' nr. ', Number) FROM dbo.Invoices
            WHERE ConsultationId = @ConsultationId AND ClinicId = @ClinicId
              AND IsStorno = 0 AND StatusId = @IssuedStatusId);

        IF @ActiveInvoice IS NOT NULL
        BEGIN
            DECLARE @DupMsg NVARCHAR(300) = CONCAT(N'Consultația are deja factura ', @ActiveInvoice,
                N'. Pentru corecții, stornați întâi factura.');
            ;THROW 50621, @DupMsg, 1;
        END;

        DECLARE @HasCustomLines BIT = CASE WHEN EXISTS (SELECT 1 FROM @Lines) THEN 1 ELSE 0 END;

        IF @HasCustomLines = 1 AND NOT EXISTS (
            SELECT 1 FROM dbo.Invoices i
            INNER JOIN dbo.InvoiceStatuses st ON st.Id = i.StatusId
            WHERE i.ConsultationId = @ConsultationId AND i.ClinicId = @ClinicId AND st.Code = N'STORNATA')
        BEGIN
            ;THROW 50622, N'Liniile se pot modifica doar pe factura de corecție, după stornarea facturii inițiale.', 1;
        END;

        -- ── Client ───────────────────────────────────────────────────────────
        SET @CustomerName = NULLIF(LTRIM(RTRIM(@CustomerName)), N'');
        IF @CustomerName IS NULL
        BEGIN
            ;THROW 50627, N'Numele clientului este obligatoriu.', 1;
        END;

        IF @CustomerIsLegalEntity = 1
           AND (NULLIF(LTRIM(RTRIM(@CustomerFiscalCode)), N'') IS NULL OR NULLIF(LTRIM(RTRIM(@CustomerAddress)), N'') IS NULL)
        BEGIN
            ;THROW 50627, N'Pentru persoane juridice, CUI-ul și adresa sunt obligatorii.', 1;
        END;

        DECLARE @CustomerCnp NCHAR(13) = NULL;
        IF @CustomerIsLegalEntity = 0 AND @IncludeCnp = 1
        BEGIN
            SELECT @CustomerCnp = Cnp FROM dbo.Patients WHERE Id = @PatientId AND ClinicId = @ClinicId;
            IF @CustomerCnp IS NULL OR LEN(@CustomerCnp) <> 13
            BEGIN
                ;THROW 50627, N'Pacientul nu are un CNP valid înregistrat în fișă.', 1;
            END;
        END;

        IF @CustomerIsLegalEntity = 0
        BEGIN
            SET @CustomerFiscalCode = NULL;
            SET @CustomerTradeRegisterNumber = NULL;
        END;

        -- ── Furnizor (snapshot) ──────────────────────────────────────────────
        DECLARE @SupplierName NVARCHAR(200), @SupplierFiscalCode NVARCHAR(20), @SupplierRegCom NVARCHAR(30),
                @SupplierAddress NVARCHAR(500), @SupplierCity NVARCHAR(100), @SupplierCounty NVARCHAR(100),
                @SupplierBank NVARCHAR(100), @SupplierIban NVARCHAR(34), @SupplierIsVatPayer BIT;

        SELECT @SupplierName = c.Name, @SupplierFiscalCode = c.FiscalCode, @SupplierRegCom = c.TradeRegisterNumber,
               @SupplierAddress = c.Address, @SupplierCity = c.City, @SupplierCounty = c.County,
               @SupplierBank = ISNULL(ba.BankName, c.BankName), @SupplierIban = ISNULL(ba.Iban, c.BankAccount),
               @SupplierIsVatPayer = c.IsVatPayer
        FROM dbo.Clinics c
        OUTER APPLY (SELECT TOP (1) b.BankName, b.Iban FROM dbo.ClinicBankAccounts b
                     WHERE b.ClinicId = c.Id AND b.IsDeleted = 0 AND b.Currency = N'RON'
                     ORDER BY b.IsMain DESC, b.CreatedAt) ba
        WHERE c.Id = @ClinicId;

        IF NULLIF(LTRIM(RTRIM(@SupplierFiscalCode)), N'') IS NULL OR NULLIF(LTRIM(RTRIM(@SupplierName)), N'') IS NULL
        BEGIN
            ;THROW 50623, N'Datele fiscale ale clinicii sunt incomplete (denumire / CUI). Completați-le în configurarea clinicii.', 1;
        END;

        -- ── Linii ────────────────────────────────────────────────────────────
        DECLARE @L TABLE (
            ConsultationServiceId UNIQUEIDENTIFIER NULL, MedicalServiceId UNIQUEIDENTIFIER NULL,
            Code NVARCHAR(30) NULL, Name NVARCHAR(200) NOT NULL, Quantity DECIMAL(10,3) NOT NULL,
            UnitPrice DECIMAL(18,2) NOT NULL, LineTotal DECIMAL(18,2) NOT NULL,
            VatRateId UNIQUEIDENTIFIER NOT NULL, VatPercent DECIMAL(5,2) NOT NULL, VatCategoryCode NVARCHAR(3) NOT NULL,
            ExemptionCode NVARCHAR(30) NULL, ExemptionText NVARCHAR(300) NULL, SortOrder INT NOT NULL);

        IF @HasCustomLines = 0
        BEGIN
            INSERT INTO @L
            SELECT cs.Id, cs.MedicalServiceId, cs.ServiceCode, cs.ServiceName, cs.Quantity, cs.UnitPrice, cs.LineTotal,
                   cs.VatRateId, cs.VatPercent, cs.VatCategoryCode, v.ExemptionReasonCode, v.ExemptionReasonText, cs.SortOrder
            FROM dbo.ConsultationServices cs
            INNER JOIN dbo.VatRates v ON v.Id = cs.VatRateId
            WHERE cs.ConsultationId = @ConsultationId AND cs.ClinicId = @ClinicId AND cs.IsDeleted = 0;
        END
        ELSE
        BEGIN
            IF EXISTS (SELECT 1 FROM @Lines WHERE Quantity <= 0 OR UnitPrice < 0 OR NULLIF(LTRIM(RTRIM(Name)), N'') IS NULL)
            BEGIN
                ;THROW 50622, N'Liniile facturii de corecție trebuie să aibă denumire, cantitate pozitivă și preț valid.', 1;
            END;

            IF EXISTS (SELECT 1 FROM @Lines l LEFT JOIN dbo.VatRates v ON v.Id = l.VatRateId WHERE v.Id IS NULL)
            BEGIN
                ;THROW 50616, N'Regimul TVA selectat nu este valid.', 1;
            END;

            INSERT INTO @L
            SELECT NULL, l.MedicalServiceId, l.Code, LTRIM(RTRIM(l.Name)), l.Quantity, l.UnitPrice,
                   CAST(ROUND(l.UnitPrice * l.Quantity, 2) AS DECIMAL(18,2)),
                   l.VatRateId, v.[Percent], v.UblCategoryCode, v.ExemptionReasonCode, v.ExemptionReasonText, l.SortOrder
            FROM @Lines l
            INNER JOIN dbo.VatRates v ON v.Id = l.VatRateId;
        END;

        IF NOT EXISTS (SELECT 1 FROM @L) OR (SELECT SUM(LineTotal) FROM @L) <= 0
        BEGIN
            ;THROW 50602, N'Factura nu are servicii de facturat.', 1;
        END;

        IF @SupplierIsVatPayer = 0 AND EXISTS (SELECT 1 FROM @L WHERE VatPercent > 0)
        BEGIN
            ;THROW 50623, N'Clinica nu este plătitoare de TVA, dar există servicii cu cotă de TVA mai mare decât zero.', 1;
        END;

        -- ── Număr (fără goluri) ──────────────────────────────────────────────
        IF @SeriesId IS NULL
            SELECT @SeriesId = Id FROM dbo.InvoiceSeries
            WHERE ClinicId = @ClinicId AND IsDefault = 1 AND IsActive = 1;

        DECLARE @Number INT, @Series NVARCHAR(10);

        UPDATE dbo.InvoiceSeries WITH (UPDLOCK, HOLDLOCK)
        SET @Number = LastNumber = LastNumber + 1,
            @Series = Series,
            UpdatedAt = GETDATE()
        WHERE Id = @SeriesId AND ClinicId = @ClinicId AND IsActive = 1;

        IF @Number IS NULL
        BEGIN
            ;THROW 50624, N'Nu există o serie de facturi activă. Configurați seria în Setări financiare.', 1;
        END;

        -- ── Totaluri (TVA extras din prețul final, pe linie) ─────────────────
        DECLARE @Receipts NVARCHAR(1000) = (
            SELECT STRING_AGG(CONCAT(N'bon fiscal nr. ', fr.ReceiptNumber, N' din ', FORMAT(fr.PrintedAt, 'dd.MM.yyyy')), N'; ')
            FROM dbo.FiscalReceipts fr
            INNER JOIN dbo.FiscalReceiptStatuses st ON st.Id = fr.StatusId
            WHERE fr.ConsultationId = @ConsultationId AND fr.ClinicId = @ClinicId AND st.Code = N'PRINTED');

        DECLARE @InvoiceId UNIQUEIDENTIFIER = NEWID();
        DECLARE @Now DATETIME2(0) = GETDATE();

        INSERT INTO dbo.Invoices (
            Id, ClinicId, ConsultationId, PatientId, SeriesId, Series, Number, IssueDate, IssuedAt,
            InvoiceTypeCode, IsStorno, OriginalInvoiceId, StatusId, Currency,
            SupplierName, SupplierFiscalCode, SupplierTradeRegisterNumber, SupplierAddress, SupplierCity, SupplierCounty,
            SupplierBankName, SupplierBankAccount, SupplierIsVatPayer,
            CustomerIsLegalEntity, CustomerName, CustomerCnp, CustomerFiscalCode, CustomerTradeRegisterNumber,
            CustomerAddress, CustomerCity, CustomerCounty, CustomerCountryCode,
            TotalNet, TotalVat, Total, Notes, IdempotencyKey, CreatedAt, CreatedBy)
        SELECT
            @InvoiceId, @ClinicId, @ConsultationId, @PatientId, @SeriesId, @Series, @Number, CAST(@Now AS DATE), @Now,
            N'380', 0, NULL, @IssuedStatusId, N'RON',
            @SupplierName, @SupplierFiscalCode, @SupplierRegCom, @SupplierAddress, @SupplierCity, @SupplierCounty,
            @SupplierBank, @SupplierIban, @SupplierIsVatPayer,
            @CustomerIsLegalEntity, @CustomerName, @CustomerCnp, NULLIF(LTRIM(RTRIM(@CustomerFiscalCode)), N''),
            NULLIF(LTRIM(RTRIM(@CustomerTradeRegisterNumber)), N''),
            NULLIF(LTRIM(RTRIM(@CustomerAddress)), N''), NULLIF(LTRIM(RTRIM(@CustomerCity)), N''),
            NULLIF(LTRIM(RTRIM(@CustomerCounty)), N''), N'RO',
            SUM(x.LineTotal - x.VatAmount), SUM(x.VatAmount), SUM(x.LineTotal),
            CASE WHEN @Receipts IS NULL THEN NULL ELSE CONCAT(N'Achitat cu ', @Receipts, N'.') END,
            @IdempotencyKey, @Now, @CreatedBy
        FROM (SELECT LineTotal, CAST(ROUND(LineTotal * VatPercent / (100 + VatPercent), 2) AS DECIMAL(18,2)) AS VatAmount
              FROM @L) x;

        INSERT INTO dbo.InvoiceLines (
            InvoiceId, ConsultationServiceId, MedicalServiceId, Code, Name, UnitCode, Quantity, UnitPrice, LineTotal,
            VatRateId, VatPercent, VatCategoryCode, VatExemptionReasonCode, VatExemptionReasonText,
            VatAmount, NetAmount, SortOrder)
        SELECT
            @InvoiceId, l.ConsultationServiceId, l.MedicalServiceId, l.Code, l.Name, N'C62', l.Quantity, l.UnitPrice, l.LineTotal,
            l.VatRateId, l.VatPercent, l.VatCategoryCode, l.ExemptionCode, l.ExemptionText,
            v.VatAmount, l.LineTotal - v.VatAmount, l.SortOrder
        FROM @L l
        CROSS APPLY (SELECT CAST(ROUND(l.LineTotal * l.VatPercent / (100 + l.VatPercent), 2) AS DECIMAL(18,2)) AS VatAmount) v;

        IF @StatusCode = N'FINALIZATA'
        BEGIN
            UPDATE dbo.Consultations
            SET StatusId = (SELECT Id FROM dbo.ConsultationStatuses WHERE Code = N'FACTURATA'),
                UpdatedAt = GETDATE(), UpdatedBy = @CreatedBy
            WHERE Id = @ConsultationId AND ClinicId = @ClinicId;

            INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
            VALUES (@ClinicId, N'Consultation', @ConsultationId, N'Update',
                    N'{"StatusCode":"FINALIZATA"}', N'{"StatusCode":"FACTURATA"}', @CreatedBy);
        END;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Invoice', @InvoiceId, N'Create', NULL,
                (SELECT Series, Number, ConsultationId, Total, CustomerIsLegalEntity, IsStorno
                 FROM dbo.Invoices WHERE Id = @InvoiceId FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @CreatedBy);

        COMMIT TRANSACTION;
        SELECT @InvoiceId AS InvoiceId, CAST(0 AS BIT) AS IsDuplicate;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
