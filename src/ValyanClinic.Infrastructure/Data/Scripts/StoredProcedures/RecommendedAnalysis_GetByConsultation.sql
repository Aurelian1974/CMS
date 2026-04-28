SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: RecommendedAnalysis_GetByConsultation
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.RecommendedAnalysis_GetByConsultation
    @ConsultationId UNIQUEIDENTIFIER,
    @ClinicId       UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        ra.Id, ra.ClinicId, ra.ConsultationId, ra.PatientId,
        ra.AnalysisId, ra.AnalysisName,
        a.Category   AS AnalysisCategory,
        a.Subcategory AS AnalysisSubcategory,
        ra.Priority, ra.Notes, ra.Status,
        ra.CreatedAt, ra.CreatedBy, ra.UpdatedAt, ra.UpdatedBy
    FROM dbo.RecommendedAnalyses ra
    LEFT JOIN dbo.Analyses a ON a.Id = ra.AnalysisId
    WHERE ra.ConsultationId = @ConsultationId AND ra.ClinicId = @ClinicId AND ra.IsDeleted = 0
    ORDER BY ra.Priority DESC, ra.CreatedAt;
END;
GO
