SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Invoice_Storno — factură storno (valori negative) legată de originală.
-- Aceeași serie ca originalul, număr nou alocat fără goluri. Părțile (furnizor,
-- client) se copiază din originală. Originala devine STORNATA; consultația
-- rămâne FACTURATA — corecția se face prin factura de corecție.
-- Result: InvoiceId (storno), IsDuplicate
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Invoice_Storno
    @Id             UNIQUEIDENTIFIER,
    @ClinicId       UNIQUEIDENTIFIER,
    @IdempotencyKey UNIQUEIDENTIFIER,
    @Reason         NVARCHAR(500),
    @CreatedBy      UNIQUEIDENTIFIER
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

        DECLARE @ConsultationId UNIQUEIDENTIFIER = (
            SELECT ConsultationId FROM dbo.Invoices WHERE Id = @Id AND ClinicId = @ClinicId);

        IF @ConsultationId IS NULL
        BEGIN
            ;THROW 50620, N'Factura nu a fost găsită.', 1;
        END;

        -- Ordinea de lock identică cu Invoice_Create: consultația, apoi factura
        IF NOT EXISTS (SELECT 1 FROM dbo.Consultations WITH (UPDLOCK, HOLDLOCK)
                       WHERE Id = @ConsultationId AND ClinicId = @ClinicId)
        BEGIN
            ;THROW 50020, N'Consultația nu a fost găsită.', 1;
        END;

        DECLARE @IsStorno BIT, @StatusCode NVARCHAR(30), @SeriesId UNIQUEIDENTIFIER,
                @OrigSeries NVARCHAR(10), @OrigNumber INT, @OrigDate DATE;

        SELECT @IsStorno = i.IsStorno, @StatusCode = st.Code, @SeriesId = i.SeriesId,
               @OrigSeries = i.Series, @OrigNumber = i.Number, @OrigDate = i.IssueDate
        FROM dbo.Invoices i WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.InvoiceStatuses st ON st.Id = i.StatusId
        WHERE i.Id = @Id AND i.ClinicId = @ClinicId;

        IF @IsStorno = 1
        BEGIN
            ;THROW 50626, N'O factură storno nu poate fi stornată.', 1;
        END;

        IF @StatusCode <> N'EMISA'
        BEGIN
            ;THROW 50626, N'Factura a fost deja stornată.', 1;
        END;

        IF NULLIF(LTRIM(RTRIM(@Reason)), N'') IS NULL
        BEGIN
            ;THROW 50626, N'Motivul stornării este obligatoriu.', 1;
        END;

        DECLARE @Number INT, @Series NVARCHAR(10);

        UPDATE dbo.InvoiceSeries WITH (UPDLOCK, HOLDLOCK)
        SET @Number = LastNumber = LastNumber + 1,
            @Series = Series,
            UpdatedAt = GETDATE()
        WHERE Id = @SeriesId AND ClinicId = @ClinicId;

        DECLARE @StornoId UNIQUEIDENTIFIER = NEWID();
        DECLARE @Now DATETIME2(0) = GETDATE();
        DECLARE @IssuedStatusId UNIQUEIDENTIFIER = (SELECT Id FROM dbo.InvoiceStatuses WHERE Code = N'EMISA');

        INSERT INTO dbo.Invoices (
            Id, ClinicId, ConsultationId, PatientId, SeriesId, Series, Number, IssueDate, IssuedAt,
            InvoiceTypeCode, IsStorno, OriginalInvoiceId, StornoReason, StatusId, Currency,
            SupplierName, SupplierFiscalCode, SupplierTradeRegisterNumber, SupplierAddress, SupplierCity, SupplierCounty,
            SupplierBankName, SupplierBankAccount, SupplierIsVatPayer,
            CustomerIsLegalEntity, CustomerName, CustomerCnp, CustomerFiscalCode, CustomerTradeRegisterNumber,
            CustomerAddress, CustomerCity, CustomerCounty, CustomerCountryCode,
            TotalNet, TotalVat, Total, Notes, IdempotencyKey, CreatedAt, CreatedBy)
        SELECT
            @StornoId, ClinicId, ConsultationId, PatientId, @SeriesId, @Series, @Number, CAST(@Now AS DATE), @Now,
            N'380', 1, @Id, LTRIM(RTRIM(@Reason)), @IssuedStatusId, Currency,
            SupplierName, SupplierFiscalCode, SupplierTradeRegisterNumber, SupplierAddress, SupplierCity, SupplierCounty,
            SupplierBankName, SupplierBankAccount, SupplierIsVatPayer,
            CustomerIsLegalEntity, CustomerName, CustomerCnp, CustomerFiscalCode, CustomerTradeRegisterNumber,
            CustomerAddress, CustomerCity, CustomerCounty, CustomerCountryCode,
            -TotalNet, -TotalVat, -Total,
            CONCAT(N'Stornare integrală a facturii ', @OrigSeries, N' nr. ', @OrigNumber, N' din ',
                   FORMAT(@OrigDate, 'dd.MM.yyyy'), N'. Motiv: ', LTRIM(RTRIM(@Reason))),
            @IdempotencyKey, @Now, @CreatedBy
        FROM dbo.Invoices
        WHERE Id = @Id;

        INSERT INTO dbo.InvoiceLines (
            InvoiceId, ConsultationServiceId, MedicalServiceId, Code, Name, UnitCode, Quantity, UnitPrice, LineTotal,
            VatRateId, VatPercent, VatCategoryCode, VatExemptionReasonCode, VatExemptionReasonText,
            VatAmount, NetAmount, SortOrder)
        SELECT
            @StornoId, ConsultationServiceId, MedicalServiceId, Code, Name, UnitCode, -Quantity, UnitPrice, -LineTotal,
            VatRateId, VatPercent, VatCategoryCode, VatExemptionReasonCode, VatExemptionReasonText,
            -VatAmount, -NetAmount, SortOrder
        FROM dbo.InvoiceLines
        WHERE InvoiceId = @Id;

        UPDATE dbo.Invoices
        SET StatusId = (SELECT Id FROM dbo.InvoiceStatuses WHERE Code = N'STORNATA'),
            UpdatedAt = @Now, UpdatedBy = @CreatedBy
        WHERE Id = @Id;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES
            (@ClinicId, N'Invoice', @Id, N'Storno', N'{"StatusCode":"EMISA"}',
             (SELECT N'STORNATA' AS StatusCode, @StornoId AS StornoInvoiceId, @Reason AS Reason
              FOR JSON PATH, WITHOUT_ARRAY_WRAPPER), @CreatedBy),
            (@ClinicId, N'Invoice', @StornoId, N'Create', NULL,
             (SELECT Series, Number, ConsultationId, Total, IsStorno, OriginalInvoiceId
              FROM dbo.Invoices WHERE Id = @StornoId FOR JSON PATH, WITHOUT_ARRAY_WRAPPER), @CreatedBy);

        COMMIT TRANSACTION;
        SELECT @StornoId AS InvoiceId, CAST(0 AS BIT) AS IsDuplicate;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
