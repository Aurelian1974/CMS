SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Payment_Create — încasare pe consultație (idempotent).
-- * Retry cu aceeași @IdempotencyKey întoarce plata existentă, nu creează alta.
-- * Numerar / card → se creează în aceeași tranzacție bonul fiscal PENDING (1 bon
--   per plată), liniile lui sunt snapshot din serviciile consultației, iar
--   consultația trece în FACTURATA (servicii imuabile).
-- * V1: bonul acoperă întreaga valoare a consultației, fără plăți anterioare;
--   plățile parțiale se fac prin metode fără bon (transfer).
-- Result: PaymentId, FiscalReceiptId (NULL fără bon), IsDuplicate
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Payment_Create
    @ClinicId       UNIQUEIDENTIFIER,
    @ConsultationId UNIQUEIDENTIFIER,
    @IdempotencyKey UNIQUEIDENTIFIER,
    @Tenders        dbo.PaymentTenderTableType READONLY,
    @Notes          NVARCHAR(500) = NULL,
    @CreatedBy      UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Idempotență: HOLDLOCK pe cheie blochează o inserare concurentă cu aceeași cheie
        DECLARE @ExistingId UNIQUEIDENTIFIER;
        SELECT @ExistingId = Id
        FROM dbo.Payments WITH (UPDLOCK, HOLDLOCK)
        WHERE ClinicId = @ClinicId AND IdempotencyKey = @IdempotencyKey;

        IF @ExistingId IS NOT NULL
        BEGIN
            COMMIT TRANSACTION;
            SELECT p.Id AS PaymentId, fr.Id AS FiscalReceiptId, CAST(1 AS BIT) AS IsDuplicate
            FROM dbo.Payments p
            LEFT JOIN dbo.FiscalReceipts fr ON fr.PaymentId = p.Id
            WHERE p.Id = @ExistingId;
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
            ;THROW 50600, N'Consultația trebuie finalizată înainte de încasare.', 1;
        END;

        -- ── Validare metode de plată ─────────────────────────────────────────
        IF NOT EXISTS (SELECT 1 FROM @Tenders)
        BEGIN
            ;THROW 50635, N'Selectați cel puțin o metodă de plată.', 1;
        END;

        IF EXISTS (SELECT 1 FROM @Tenders WHERE Amount <= 0)
        BEGIN
            ;THROW 50635, N'Sumele pe metodele de plată trebuie să fie pozitive.', 1;
        END;

        IF EXISTS (SELECT PaymentMethodId FROM @Tenders GROUP BY PaymentMethodId HAVING COUNT(*) > 1)
        BEGIN
            ;THROW 50635, N'O metodă de plată apare de mai multe ori.', 1;
        END;

        IF EXISTS (SELECT 1 FROM @Tenders t
                   LEFT JOIN dbo.PaymentMethods pm ON pm.Id = t.PaymentMethodId AND pm.IsActive = 1
                   WHERE pm.Id IS NULL)
        BEGIN
            ;THROW 50635, N'Metoda de plată selectată nu este validă.', 1;
        END;

        DECLARE @FiscalTenders INT, @OtherTenders INT;
        SELECT @FiscalTenders = SUM(CASE WHEN pm.RequiresFiscalReceipt = 1 THEN 1 ELSE 0 END),
               @OtherTenders  = SUM(CASE WHEN pm.RequiresFiscalReceipt = 0 THEN 1 ELSE 0 END)
        FROM @Tenders t
        INNER JOIN dbo.PaymentMethods pm ON pm.Id = t.PaymentMethodId;

        IF @FiscalTenders > 0 AND @OtherTenders > 0
        BEGIN
            ;THROW 50635, N'Transferul bancar nu se combină cu numerar / card pe aceeași încasare.', 1;
        END;

        -- ── Sume ─────────────────────────────────────────────────────────────
        DECLARE @Amount DECIMAL(18,2) = (SELECT SUM(Amount) FROM @Tenders);

        DECLARE @Total DECIMAL(18,2) = ISNULL((
            SELECT SUM(LineTotal) FROM dbo.ConsultationServices
            WHERE ConsultationId = @ConsultationId AND ClinicId = @ClinicId AND IsDeleted = 0), 0);

        IF @Total <= 0
        BEGIN
            ;THROW 50602, N'Consultația nu are servicii de încasat.', 1;
        END;

        DECLARE @Paid DECIMAL(18,2) = ISNULL((
            SELECT SUM(Amount) FROM dbo.Payments
            WHERE ConsultationId = @ConsultationId AND ClinicId = @ClinicId AND IsCancelled = 0), 0);

        DECLARE @Balance DECIMAL(18,2) = @Total - @Paid;

        IF @Balance <= 0
        BEGIN
            ;THROW 50632, N'Consultația este deja achitată integral.', 1;
        END;

        IF @Amount > @Balance
        BEGIN
            DECLARE @OverMsg NVARCHAR(300) = CONCAT(N'Suma încasată (', FORMAT(@Amount, 'N2', 'ro-RO'),
                N' RON) depășește restul de plată (', FORMAT(@Balance, 'N2', 'ro-RO'), N' RON).');
            ;THROW 50631, @OverMsg, 1;
        END;

        DECLARE @IsFiscal BIT = CASE WHEN @FiscalTenders > 0 THEN 1 ELSE 0 END;

        IF @IsFiscal = 1
        BEGIN
            IF @Paid > 0 OR @Amount <> @Total
            BEGIN
                DECLARE @FullMsg NVARCHAR(300) = CONCAT(
                    N'Bonul fiscal se emite pentru întreaga valoare a consultației (',
                    FORMAT(@Total, 'N2', 'ro-RO'), N' RON), fără plăți anterioare.');
                ;THROW 50633, @FullMsg, 1;
            END;

            IF EXISTS (SELECT 1 FROM dbo.FiscalSettings WHERE ClinicId = @ClinicId AND IsEnabled = 0)
            BEGIN
                ;THROW 50645, N'Emiterea bonurilor fiscale este dezactivată din Setări financiare.', 1;
            END;

            DECLARE @UnmappedVat NVARCHAR(150) = (
                SELECT TOP (1) v.Name
                FROM dbo.ConsultationServices cs
                INNER JOIN dbo.VatRates v ON v.Id = cs.VatRateId
                LEFT JOIN dbo.FiscalVatMappings m ON m.VatRateId = cs.VatRateId AND m.ClinicId = @ClinicId
                WHERE cs.ConsultationId = @ConsultationId AND cs.IsDeleted = 0 AND m.Id IS NULL);

            IF @UnmappedVat IS NOT NULL
            BEGIN
                DECLARE @VatMsg NVARCHAR(400) = CONCAT(N'Regimul TVA „', @UnmappedVat,
                    N'” nu este mapat la o grupă de TVA a casei de marcat (Setări financiare).');
                ;THROW 50642, @VatMsg, 1;
            END;

            DECLARE @UnmappedMethod NVARCHAR(100) = (
                SELECT TOP (1) pm.Name
                FROM @Tenders t
                INNER JOIN dbo.PaymentMethods pm ON pm.Id = t.PaymentMethodId
                LEFT JOIN dbo.FiscalPaymentMappings m ON m.PaymentMethodId = t.PaymentMethodId AND m.ClinicId = @ClinicId
                WHERE m.Id IS NULL);

            IF @UnmappedMethod IS NOT NULL
            BEGIN
                DECLARE @MethodMsg NVARCHAR(400) = CONCAT(N'Metoda de plată „', @UnmappedMethod,
                    N'” nu este mapată la un tip de plată al casei de marcat (Setări financiare).');
                ;THROW 50642, @MethodMsg, 1;
            END;
        END;

        -- ── Inserare ─────────────────────────────────────────────────────────
        DECLARE @PaymentId UNIQUEIDENTIFIER = NEWID();

        INSERT INTO dbo.Payments (Id, ClinicId, ConsultationId, PatientId, Amount, PaidAt, IdempotencyKey, Notes, CreatedAt, CreatedBy)
        VALUES (@PaymentId, @ClinicId, @ConsultationId, @PatientId, @Amount, GETDATE(), @IdempotencyKey, @Notes, GETDATE(), @CreatedBy);

        INSERT INTO dbo.PaymentTenders (PaymentId, PaymentMethodId, Amount)
        SELECT @PaymentId, PaymentMethodId, Amount FROM @Tenders;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Payment', @PaymentId, N'Create', NULL,
                (SELECT @ConsultationId AS ConsultationId, @Amount AS Amount,
                        (SELECT PaymentMethodId, Amount FROM @Tenders FOR JSON PATH) AS Tenders
                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @CreatedBy);

        DECLARE @ReceiptId UNIQUEIDENTIFIER = NULL;

        IF @IsFiscal = 1
        BEGIN
            DECLARE @PendingId UNIQUEIDENTIFIER = (SELECT Id FROM dbo.FiscalReceiptStatuses WHERE Code = N'PENDING');
            SET @ReceiptId = NEWID();

            INSERT INTO dbo.FiscalReceipts (Id, ClinicId, ConsultationId, PaymentId, StatusId, Amount, CreatedAt, CreatedBy)
            VALUES (@ReceiptId, @ClinicId, @ConsultationId, @PaymentId, @PendingId, @Amount, GETDATE(), @CreatedBy);

            INSERT INTO dbo.FiscalReceiptLines (FiscalReceiptId, Name, UnitPrice, Quantity, LineTotal, VatRateId, TaxGroup, SortOrder)
            SELECT @ReceiptId, cs.ServiceName, cs.UnitPrice, cs.Quantity, cs.LineTotal, cs.VatRateId, m.TaxGroup, cs.SortOrder
            FROM dbo.ConsultationServices cs
            INNER JOIN dbo.FiscalVatMappings m ON m.VatRateId = cs.VatRateId AND m.ClinicId = @ClinicId
            WHERE cs.ConsultationId = @ConsultationId AND cs.IsDeleted = 0;

            INSERT INTO dbo.FiscalReceiptEvents (ClinicId, FiscalReceiptId, FromStatusId, ToStatusId, Message, CreatedAt, CreatedBy)
            VALUES (@ClinicId, @ReceiptId, NULL, @PendingId, N'Bon creat, în așteptarea tipăririi.', GETDATE(), @CreatedBy);

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
        END;

        COMMIT TRANSACTION;
        SELECT @PaymentId AS PaymentId, @ReceiptId AS FiscalReceiptId, CAST(0 AS BIT) AS IsDuplicate;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
