SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: RecommendedAnalysis_Delete (soft delete)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.RecommendedAnalysis_Delete
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.RecommendedAnalyses
                   WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50025, N'Analiza recomandata nu a fost gasita.', 1;
    END;

    IF EXISTS (
        SELECT 1 FROM dbo.RecommendedAnalyses ra
        INNER JOIN dbo.Consultations c ON c.Id = ra.ConsultationId
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE ra.Id = @Id AND s.Code = 'BLOCATA'
    )
    BEGIN
        ;THROW 50021, N'Consultatia este blocata si nu poate fi modificata.', 1;
    END;

    UPDATE dbo.RecommendedAnalyses
    SET IsDeleted = 1, UpdatedAt = SYSDATETIME(), UpdatedBy = @DeletedBy
    WHERE Id = @Id;

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'RecommendedAnalysis', @Id, N'Delete', NULL, NULL, @DeletedBy);
END;
GO
