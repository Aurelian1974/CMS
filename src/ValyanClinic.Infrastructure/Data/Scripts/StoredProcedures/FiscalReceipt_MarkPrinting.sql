SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: FiscalReceipt_MarkPrinting — rezervă bonul pentru tipărire.
-- Permis din PENDING (prima încercare) sau FAILED (reluare MANUALĂ, după ce
-- utilizatorul a rezolvat cauza: hârtie, capac, aparat pornit).
-- Din UNKNOWN / PRINTING nu se mai tipărește — întâi reconciliere.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.FiscalReceipt_MarkPrinting
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @UpdatedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @FromStatusId UNIQUEIDENTIFIER, @FromCode NVARCHAR(30);
        SELECT @FromStatusId = fr.StatusId, @FromCode = st.Code
        FROM dbo.FiscalReceipts fr WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.FiscalReceiptStatuses st ON st.Id = fr.StatusId
        WHERE fr.Id = @Id AND fr.ClinicId = @ClinicId;

        IF @FromStatusId IS NULL
        BEGIN
            ;THROW 50640, N'Bonul fiscal nu a fost găsit.', 1;
        END;

        IF @FromCode NOT IN (N'PENDING', N'FAILED')
        BEGIN
            DECLARE @Msg NVARCHAR(300) = CASE @FromCode
                WHEN N'PRINTED'   THEN N'Bonul fiscal a fost deja emis.'
                WHEN N'CANCELLED' THEN N'Bonul fiscal a fost anulat.'
                ELSE N'Starea bonului nu este confirmată. Faceți întâi reconcilierea (verificați dacă bonul a ieșit din aparat).'
            END;
            ;THROW 50641, @Msg, 1;
        END;

        DECLARE @PrintingId UNIQUEIDENTIFIER = (SELECT Id FROM dbo.FiscalReceiptStatuses WHERE Code = N'PRINTING');

        UPDATE dbo.FiscalReceipts SET
            StatusId     = @PrintingId,
            AttemptCount = AttemptCount + 1,
            LastError    = NULL,
            UpdatedAt    = GETDATE(),
            UpdatedBy    = @UpdatedBy
        WHERE Id = @Id;

        INSERT INTO dbo.FiscalReceiptEvents (ClinicId, FiscalReceiptId, FromStatusId, ToStatusId, Message, CreatedAt, CreatedBy)
        VALUES (@ClinicId, @Id, @FromStatusId, @PrintingId,
                CASE WHEN @FromCode = N'FAILED' THEN N'Reluare manuală a tipăririi.' ELSE N'Trimis la casa de marcat.' END,
                GETDATE(), @UpdatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
