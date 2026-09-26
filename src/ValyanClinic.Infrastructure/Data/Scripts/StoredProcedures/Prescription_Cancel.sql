SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Prescription_Cancel
-- Anulează o rețetă emisă / transmisă. Rețeta nu se șterge (trasabilitate CNAS):
-- rămâne în istoric cu motivul anulării; ciornele se șterg cu Prescription_Delete.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Prescription_Cancel
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

        DECLARE @StatusCode NVARCHAR(30), @ConsultationId UNIQUEIDENTIFIER;

        SELECT @StatusCode = s.Code, @ConsultationId = p.ConsultationId
        FROM dbo.Prescriptions p WITH (UPDLOCK)
        INNER JOIN dbo.PrescriptionStatuses s ON s.Id = p.StatusId
        WHERE p.Id = @Id AND p.ClinicId = @ClinicId AND p.IsDeleted = 0;

        IF @StatusCode IS NULL
        BEGIN
            ;THROW 50041, N'Rețeta nu a fost găsită.', 1;
        END;

        IF @StatusCode NOT IN (N'EMISA', N'TRANSMISA')
        BEGIN
            ;THROW 50044, N'Doar rețetele emise sau transmise pot fi anulate. Ciornele se șterg.', 1;
        END;

        UPDATE dbo.Prescriptions SET
            StatusId     = (SELECT Id FROM dbo.PrescriptionStatuses WHERE Code = N'ANULATA'),
            CancelReason = @Reason,
            CancelledAt  = GETDATE(),
            CancelledBy  = @CancelledBy,
            UpdatedAt    = GETDATE(),
            UpdatedBy    = @CancelledBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        EXEC dbo.Prescription_SyncConsultation
            @ClinicId = @ClinicId, @ConsultationId = @ConsultationId, @UpdatedBy = @CancelledBy;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Prescription', @Id, N'Cancel',
                (SELECT @StatusCode AS StatusCode FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                (SELECT @Reason AS Reason FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @CancelledBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
