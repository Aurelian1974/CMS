SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: FiscalReceipt_SetResult — rezultatul raportat de fiscal bridge.
-- Doar din PRINTING, către PRINTED / FAILED / UNKNOWN.
-- Raportarea repetată a aceluiași rezultat PRINTED (retry din UI) e no-op.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.FiscalReceipt_SetResult
    @Id                 UNIQUEIDENTIFIER,
    @ClinicId           UNIQUEIDENTIFIER,
    @StatusCode         NVARCHAR(30),
    @ReceiptNumber      NVARCHAR(30)   = NULL,
    @DeviceSerialNumber NVARCHAR(30)   = NULL,
    @PrintedAt          DATETIME2(0)   = NULL,
    @ErrorMessage       NVARCHAR(1000) = NULL,
    @DeviceResponse     NVARCHAR(MAX)  = NULL,
    @UpdatedBy          UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @FromStatusId UNIQUEIDENTIFIER, @FromCode NVARCHAR(30), @CurrentNumber NVARCHAR(30);
        SELECT @FromStatusId = fr.StatusId, @FromCode = st.Code, @CurrentNumber = fr.ReceiptNumber
        FROM dbo.FiscalReceipts fr WITH (UPDLOCK, HOLDLOCK)
        INNER JOIN dbo.FiscalReceiptStatuses st ON st.Id = fr.StatusId
        WHERE fr.Id = @Id AND fr.ClinicId = @ClinicId;

        IF @FromStatusId IS NULL
        BEGIN
            ;THROW 50640, N'Bonul fiscal nu a fost găsit.', 1;
        END;

        IF @FromCode = N'PRINTED' AND @StatusCode = N'PRINTED' AND @CurrentNumber = @ReceiptNumber
        BEGIN
            COMMIT TRANSACTION;
            RETURN;
        END;

        IF @FromCode <> N'PRINTING' OR @StatusCode NOT IN (N'PRINTED', N'FAILED', N'UNKNOWN')
        BEGIN
            ;THROW 50641, N'Tranziție invalidă pentru bonul fiscal; reîncărcați starea bonului.', 1;
        END;

        IF @StatusCode = N'PRINTED' AND NULLIF(LTRIM(RTRIM(@ReceiptNumber)), N'') IS NULL
        BEGIN
            ;THROW 50643, N'Numărul bonului fiscal este obligatoriu pentru un bon emis.', 1;
        END;

        DECLARE @ToStatusId UNIQUEIDENTIFIER = (SELECT Id FROM dbo.FiscalReceiptStatuses WHERE Code = @StatusCode);

        UPDATE dbo.FiscalReceipts SET
            StatusId           = @ToStatusId,
            ReceiptNumber      = CASE WHEN @StatusCode = N'PRINTED' THEN @ReceiptNumber ELSE ReceiptNumber END,
            DeviceSerialNumber = ISNULL(@DeviceSerialNumber, DeviceSerialNumber),
            PrintedAt          = CASE WHEN @StatusCode = N'PRINTED' THEN ISNULL(@PrintedAt, GETDATE()) ELSE PrintedAt END,
            LastError          = CASE WHEN @StatusCode = N'PRINTED' THEN NULL ELSE @ErrorMessage END,
            DeviceResponse     = @DeviceResponse,
            UpdatedAt          = GETDATE(),
            UpdatedBy          = @UpdatedBy
        WHERE Id = @Id;

        INSERT INTO dbo.FiscalReceiptEvents (ClinicId, FiscalReceiptId, FromStatusId, ToStatusId, Message, DeviceResponse, CreatedAt, CreatedBy)
        VALUES (@ClinicId, @Id, @FromStatusId, @ToStatusId,
                CASE @StatusCode
                    WHEN N'PRINTED' THEN CONCAT(N'Bon emis, nr. ', @ReceiptNumber)
                    ELSE @ErrorMessage
                END,
                @DeviceResponse, GETDATE(), @UpdatedBy);

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'FiscalReceipt', @Id, N'Update',
                (SELECT @FromCode AS StatusCode FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                (SELECT @StatusCode AS StatusCode, @ReceiptNumber AS ReceiptNumber FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @UpdatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
