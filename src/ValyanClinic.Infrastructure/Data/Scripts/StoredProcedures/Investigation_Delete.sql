SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Investigation_Delete (soft delete)
-- Permis doar pe consultatii in lucru. Linia de serviciu legata se elimina.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Investigation_Delete
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @ConsultationId UNIQUEIDENTIFIER;
    SELECT @ConsultationId = ConsultationId
    FROM dbo.ConsultationInvestigations
    WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

    IF @ConsultationId IS NULL
    BEGIN
        ;THROW 50023, N'Investigatia nu a fost gasita.', 1;
    END;

    IF EXISTS (
        SELECT 1 FROM dbo.Consultations c
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND s.Code <> 'INLUCRU'
    )
    BEGIN
        ;THROW 50021, N'Consultatia este finalizata si nu mai poate fi modificata.', 1;
    END;

    UPDATE dbo.ConsultationInvestigations
    SET IsDeleted = 1,
        UpdatedAt = SYSDATETIME(),
        UpdatedBy = @DeletedBy
    WHERE Id = @Id AND ClinicId = @ClinicId;

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'ConsultationInvestigation', @Id, N'Delete', NULL, NULL, @DeletedBy);

    EXEC dbo.ConsultationService_SyncFromInvestigations
        @ClinicId = @ClinicId, @ConsultationId = @ConsultationId, @UserId = @DeletedBy;

    COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
