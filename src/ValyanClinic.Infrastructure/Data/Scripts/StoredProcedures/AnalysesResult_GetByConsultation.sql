SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: AnalysesResult_GetByConsultation
-- Descriere: Lista buletine pentru o consultatie (header only, fara detalii).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.AnalysesResult_GetByConsultation
    @ConsultationId UNIQUEIDENTIFIER,
    @ClinicId       UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        r.Id,
        r.ClinicId,
        r.PatientId,
        CONCAT(p.LastName, ' ', p.FirstName) AS PatientName,
        r.ConsultationId,
        r.Laboratory,
        r.BulletinNumber,
        r.CollectionDate,
        r.ResultDate,
        r.DoctorName,
        r.CreatedAt,
        r.CreatedBy
    FROM dbo.AnalysesResults r
    INNER JOIN dbo.Patients p ON p.Id = r.PatientId
    WHERE r.ConsultationId = @ConsultationId
      AND r.ClinicId       = @ClinicId
      AND r.IsDeleted      = 0
    ORDER BY r.CollectionDate DESC, r.CreatedAt DESC;
END;
GO
