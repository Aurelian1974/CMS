SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: RecommendedAnalysis_Create
-- Adauga o analiza recomandata la consultatie.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.RecommendedAnalysis_Create
    @ClinicId       UNIQUEIDENTIFIER,
    @ConsultationId UNIQUEIDENTIFIER,
    @PatientId      UNIQUEIDENTIFIER,
    @AnalysisId     UNIQUEIDENTIFIER,
    @Priority       TINYINT       = 1,
    @Notes          NVARCHAR(1000) = NULL,
    @Status         TINYINT       = 0,
    @CreatedBy      UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Consultations
                   WHERE Id = @ConsultationId AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50020, N'Consultatia nu a fost gasita.', 1;
    END;

    IF EXISTS (
        SELECT 1 FROM dbo.Consultations c
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND s.Code = 'BLOCATA'
    )
    BEGIN
        ;THROW 50021, N'Consultatia este blocata si nu poate fi modificata.', 1;
    END;

    DECLARE @AnalysisName NVARCHAR(500) = (SELECT Name FROM dbo.Analyses WHERE Id = @AnalysisId);
    IF @AnalysisName IS NULL
    BEGIN
        ;THROW 50024, N'Analiza nu a fost gasita in dictionar.', 1;
    END;

    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

    INSERT INTO dbo.RecommendedAnalyses
        (Id, ClinicId, ConsultationId, PatientId, AnalysisId, AnalysisName, Priority, Notes, Status, CreatedBy)
    VALUES
        (@NewId, @ClinicId, @ConsultationId, @PatientId, @AnalysisId, @AnalysisName, @Priority, @Notes, @Status, @CreatedBy);

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'RecommendedAnalysis', @NewId, N'Create', NULL,
            (SELECT @AnalysisId AS AnalysisId, @Priority AS Priority, @Status AS Status FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            @CreatedBy);

    SELECT @NewId;
END;
GO
