SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Investigation_Delete (soft delete)
-- Nu permite stergerea pe consultatii blocate.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Investigation_Delete
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

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
        WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND s.Code = 'BLOCATA'
    )
    BEGIN
        ;THROW 50021, N'Consultatia este blocata si nu poate fi modificata.', 1;
    END;

    UPDATE dbo.ConsultationInvestigations
    SET IsDeleted = 1,
        UpdatedAt = SYSDATETIME(),
        UpdatedBy = @DeletedBy
    WHERE Id = @Id AND ClinicId = @ClinicId;

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'ConsultationInvestigation', @Id, N'Delete', NULL, NULL, @DeletedBy);
END;
GO
