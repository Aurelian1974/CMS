SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: AnalysesResult_GetById
-- Descriere: Returneaza 2 result sets: header (1 rand) + linii detaliu.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.AnalysesResult_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: header
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
        r.IsDeleted,
        r.CreatedAt,
        r.CreatedBy,
        r.UpdatedAt,
        r.UpdatedBy
    FROM dbo.AnalysesResults r
    INNER JOIN dbo.Patients p ON p.Id = r.PatientId
    WHERE r.Id = @Id
      AND r.ClinicId = @ClinicId;

    -- Result set 2: linii detaliu (ordonate dupa SortOrder)
    SELECT
        d.Id,
        d.ResultId,
        d.Section,
        d.TestName,
        d.Value,
        d.Unit,
        d.ReferenceRange,
        d.RefMin,
        d.RefMax,
        d.Flag,
        d.Method,
        d.Notes,
        d.Category,
        d.Subcategory,
        d.SortOrder
    FROM dbo.AnalysesResultDetails d
    WHERE d.ResultId = @Id
      AND d.ClinicId = @ClinicId
      AND d.IsDeleted = 0
    ORDER BY d.SortOrder;
END;
GO
