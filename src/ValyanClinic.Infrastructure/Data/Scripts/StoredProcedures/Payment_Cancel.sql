SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Payment_Cancel — anulează o încasare.
-- * Plată cu bon EMIS: nu se poate anula aici (retur = bon storno pe aparat, în afara V1).
-- * Bon cu stare NECUNOSCUTĂ / în tipărire: întâi reconciliere.
-- * Bon în așteptare / eșuat: devine ANULAT.
-- Dacă nu mai rămâne niciun document fiscal (bon activ sau factură), consultația
-- revine la FINALIZATA și serviciile pot fi din nou modificate.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Payment_Cancel
    @Id          UNIQUEIDENTIFIER,
    @ClinicId    UNIQUEIDENTIFIER,
    @Reason      NVARCHAR(500),
    @CancelledBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @ConsultationId UNIQUEIDENTIFIER, @IsCancelled BIT;
        SELECT @ConsultationId = ConsultationId, @IsCancelled = IsCancelled
        FROM dbo.Payments
        WHERE Id = @Id AND ClinicId = @ClinicId;

        IF @ConsultationId IS NULL
        BEGIN
            ;THROW 50630, N'Încasarea nu a fost găsită.', 1;
        END;

        -- Aceeași ordine de lock ca la emitere: consultația întâi
        DECLARE @StatusCode NVARCHAR(50);
        SELECT @StatusCode = s.Code
        FROM dbo.Consultations c WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId;

        IF @IsCancelled = 1
        BEGIN
            ;THROW 50634, N'Încasarea este deja anulată.', 1;
        END;

        DECLARE @ReceiptId UNIQUEIDENTIFIER, @ReceiptStatusId UNIQUEIDENTIFIER, @ReceiptStatus NVARCHAR(30);
        SELECT @ReceiptId = fr.Id, @ReceiptStatusId = fr.StatusId, @ReceiptStatus = st.Code
        FROM dbo.FiscalReceipts fr WITH (UPDLOCK)
        INNER JOIN dbo.FiscalReceiptStatuses st ON st.Id = fr.StatusId
        WHERE fr.PaymentId = @Id;

        IF @ReceiptStatus = N'PRINTED'
        BEGIN
            ;THROW 50634, N'Bonul fiscal a fost emis; încasarea nu se mai poate anula din aplicație (retur prin bon storno pe casa de marcat).', 1;
        END;

        IF @ReceiptStatus IN (N'UNKNOWN', N'PRINTING')
        BEGIN
            ;THROW 50644, N'Starea bonului fiscal nu este confirmată. Faceți întâi reconcilierea (verificați dacă bonul a ieșit din aparat).', 1;
        END;

        UPDATE dbo.Payments SET
            IsCancelled  = 1,
            CancelReason = @Reason,
            CancelledAt  = GETDATE(),
            CancelledBy  = @CancelledBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Payment', @Id, N'Cancel', N'{"IsCancelled":false}',
                (SELECT CAST(1 AS BIT) AS IsCancelled, @Reason AS Reason FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @CancelledBy);

        IF @ReceiptId IS NOT NULL
        BEGIN
            DECLARE @CancelledStatusId UNIQUEIDENTIFIER = (SELECT Id FROM dbo.FiscalReceiptStatuses WHERE Code = N'CANCELLED');

            UPDATE dbo.FiscalReceipts
            SET StatusId = @CancelledStatusId, UpdatedAt = GETDATE(), UpdatedBy = @CancelledBy
            WHERE Id = @ReceiptId;

            INSERT INTO dbo.FiscalReceiptEvents (ClinicId, FiscalReceiptId, FromStatusId, ToStatusId, Message, CreatedAt, CreatedBy)
            VALUES (@ClinicId, @ReceiptId, @ReceiptStatusId, @CancelledStatusId,
                    CONCAT(N'Anulat odată cu încasarea: ', @Reason), GETDATE(), @CancelledBy);
        END;

        -- Fără bon activ și fără nicio factură → consultația se poate reface
        IF @StatusCode = N'FACTURATA'
           AND NOT EXISTS (SELECT 1 FROM dbo.Invoices WHERE ConsultationId = @ConsultationId AND ClinicId = @ClinicId)
           AND NOT EXISTS (SELECT 1 FROM dbo.FiscalReceipts fr
                           INNER JOIN dbo.FiscalReceiptStatuses st ON st.Id = fr.StatusId
                           WHERE fr.ConsultationId = @ConsultationId AND st.Code <> N'CANCELLED')
        BEGIN
            UPDATE dbo.Consultations
            SET StatusId = (SELECT Id FROM dbo.ConsultationStatuses WHERE Code = N'FINALIZATA'),
                UpdatedAt = GETDATE(), UpdatedBy = @CancelledBy
            WHERE Id = @ConsultationId AND ClinicId = @ClinicId;

            INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
            VALUES (@ClinicId, N'Consultation', @ConsultationId, N'Update',
                    N'{"StatusCode":"FACTURATA"}', N'{"StatusCode":"FINALIZATA"}', @CancelledBy);
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
