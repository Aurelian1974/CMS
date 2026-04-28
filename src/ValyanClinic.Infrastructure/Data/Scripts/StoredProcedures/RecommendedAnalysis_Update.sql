SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: RecommendedAnalysis_Update
-- Actualizeaza prioritate, observatii si status.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.RecommendedAnalysis_Update
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @Priority  TINYINT,
    @Notes     NVARCHAR(1000) = NULL,
    @Status    TINYINT,
    @UpdatedBy UNIQUEIDENTIFIER
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
    SET Priority = @Priority,
        Notes = @Notes,
        Status = @Status,
        UpdatedAt = SYSDATETIME(),
        UpdatedBy = @UpdatedBy
    WHERE Id = @Id;

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'RecommendedAnalysis', @Id, N'Update', NULL,
            (SELECT @Priority AS Priority, @Status AS Status FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            @UpdatedBy);
END;
GO
