SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Investigation_GetByPatient
-- Lista investigatiilor unui pacient cu filtre optionale (tip, interval data).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Investigation_GetByPatient
    @PatientId          UNIQUEIDENTIFIER,
    @ClinicId           UNIQUEIDENTIFIER,
    @InvestigationType  NVARCHAR(50)  = NULL,
    @DateFrom           DATE          = NULL,
    @DateTo             DATE          = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        i.Id, i.ClinicId, i.ConsultationId, i.PatientId, i.DoctorId,
        CONCAT(d.LastName, ' ', d.FirstName) AS DoctorName,
        i.InvestigationType,
        td.DisplayName AS InvestigationTypeDisplayName,
        td.UIPattern,
        td.ParentTab,
        td.Category,
        i.InvestigationDate,
        i.StructuredData, i.Narrative,
        i.IsExternal, i.ExternalSource, i.Status,
        i.AttachedDocumentId,
        doc.FileName AS AttachedDocumentName,
        i.HasStructuredData,
        i.CreatedAt, i.CreatedBy, i.UpdatedAt, i.UpdatedBy
    FROM dbo.ConsultationInvestigations i
    INNER JOIN dbo.Doctors d ON d.Id = i.DoctorId
    INNER JOIN dbo.InvestigationTypeDefinitions td ON td.TypeCode = i.InvestigationType
    LEFT  JOIN dbo.Documents doc ON doc.Id = i.AttachedDocumentId
    WHERE i.PatientId = @PatientId
      AND i.ClinicId = @ClinicId
      AND i.IsDeleted = 0
      AND (@InvestigationType IS NULL OR i.InvestigationType = @InvestigationType)
      AND (@DateFrom IS NULL OR i.InvestigationDate >= @DateFrom)
      AND (@DateTo   IS NULL OR i.InvestigationDate <= @DateTo)
    ORDER BY i.InvestigationDate DESC, i.CreatedAt DESC;
END;
GO
