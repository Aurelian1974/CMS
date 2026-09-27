SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: FiscalReceipt_Reconcile — confirmarea MANUALĂ a unui bon cu stare
-- necunoscută (răspuns pierdut) sau rămas „în tipărire” (sesiune întreruptă).
--   @WasPrinted = 1 → PRINTED (numărul bonului de pe hârtie e obligatoriu)
--   @WasPrinted = 0 → FAILED (se poate relua manual sau anula încasarea)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.FiscalReceipt_Reconcile
    @Id            UNIQUEIDENTIFIER,
    @ClinicId      UNIQUEIDENTIFIER,
    @WasPrinted    BIT,
    @ReceiptNumber NVARCHAR(30)  = NULL,
    @Note          NVARCHAR(500) = NULL,
    @UserId        UNIQUEIDENTIFIER
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

        IF @FromCode NOT IN (N'UNKNOWN', N'PRINTING')
        BEGIN
            ;THROW 50641, N'Reconcilierea se face doar pentru bonurile cu stare necunoscută.', 1;
        END;

        IF @WasPrinted = 1 AND NULLIF(LTRIM(RTRIM(@ReceiptNumber)), N'') IS NULL
        BEGIN
            ;THROW 50643, N'Introduceți numărul bonului fiscal tipărit.', 1;
        END;

        DECLARE @ToCode NVARCHAR(30) = CASE WHEN @WasPrinted = 1 THEN N'PRINTED' ELSE N'FAILED' END;
        DECLARE @ToStatusId UNIQUEIDENTIFIER = (SELECT Id FROM dbo.FiscalReceiptStatuses WHERE Code = @ToCode);

        UPDATE dbo.FiscalReceipts SET
            StatusId             = @ToStatusId,
            ReceiptNumber        = CASE WHEN @WasPrinted = 1 THEN @ReceiptNumber ELSE NULL END,
            PrintedAt            = CASE WHEN @WasPrinted = 1 THEN ISNULL(PrintedAt, GETDATE()) ELSE NULL END,
            LastError            = CASE WHEN @WasPrinted = 1 THEN NULL
                                        ELSE N'Confirmat manual: bonul NU a fost tipărit.' END,
            IsManuallyReconciled = 1,
            ReconciliationNote   = @Note,
            ReconciledAt         = GETDATE(),
            ReconciledBy         = @UserId,
            UpdatedAt            = GETDATE(),
            UpdatedBy            = @UserId
        WHERE Id = @Id;

        INSERT INTO dbo.FiscalReceiptEvents (ClinicId, FiscalReceiptId, FromStatusId, ToStatusId, Message, CreatedAt, CreatedBy)
        VALUES (@ClinicId, @Id, @FromStatusId, @ToStatusId,
                CONCAT(CASE WHEN @WasPrinted = 1 THEN CONCAT(N'Reconciliere manuală: bon tipărit, nr. ', @ReceiptNumber)
                            ELSE N'Reconciliere manuală: bonul nu a fost tipărit' END,
                       CASE WHEN @Note IS NULL THEN N'' ELSE CONCAT(N' — ', @Note) END),
                GETDATE(), @UserId);

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'FiscalReceipt', @Id, N'Reconcile',
                (SELECT @FromCode AS StatusCode FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                (SELECT @ToCode AS StatusCode, @ReceiptNumber AS ReceiptNumber, @Note AS Note
                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @UserId);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
