SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Prescription_Delete
-- Soft delete pentru rețetele în ciornă (neemise). Rețetele emise se anulează.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Prescription_Delete
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @StatusCode NVARCHAR(30);

        SELECT @StatusCode = s.Code
        FROM dbo.Prescriptions p WITH (UPDLOCK)
        INNER JOIN dbo.PrescriptionStatuses s ON s.Id = p.StatusId
        WHERE p.Id = @Id AND p.ClinicId = @ClinicId AND p.IsDeleted = 0;

        IF @StatusCode IS NULL
        BEGIN
            ;THROW 50041, N'Rețeta nu a fost găsită.', 1;
        END;

        IF @StatusCode <> N'CIORNA'
        BEGIN
            ;THROW 50042, N'Doar rețetele în ciornă pot fi șterse; rețetele emise se anulează.', 1;
        END;

        UPDATE dbo.PrescriptionItems SET
            IsDeleted = 1, UpdatedAt = GETDATE(), UpdatedBy = @DeletedBy
        WHERE PrescriptionId = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        UPDATE dbo.Prescriptions SET
            IsDeleted = 1, UpdatedAt = GETDATE(), UpdatedBy = @DeletedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Prescription', @Id, N'Delete', NULL, NULL, @DeletedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
