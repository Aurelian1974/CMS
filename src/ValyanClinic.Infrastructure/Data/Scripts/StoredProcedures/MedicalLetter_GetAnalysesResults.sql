SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: MedicalLetter_GetAnalysesResults
-- Descriere: Returneaza toate buletinele de analize + liniile detaliu pentru
--            o consultatie, grupate pentru afisarea in scrisoarea medicala.
--
-- Result set 1: headerele buletinelor (AnalysesResults) legate de consultatie
-- Result set 2: toate liniile detaliu (AnalysesResultDetails) ale buletinelor
--               returnate in RS1, ordonate: sectiune → tip flag → nume test
--
-- Conventia de ordonare pentru flag:
--   NULL  → valori normale (apar primele)
--   LOW / HIGH → valori patologice
--   CHECK      → valori critice (apar ultimele)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.MedicalLetter_GetAnalysesResults
    @ConsultationId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: headere buletine (fara ClinicId/PatientId — nu sunt necesare in letter)
    SELECT
        r.Id,
        r.Laboratory,
        r.BulletinNumber,
        r.CollectionDate,
        r.ResultDate,
        r.DoctorName
    FROM dbo.AnalysesResults r
    WHERE r.ConsultationId = @ConsultationId
      AND r.IsDeleted      = 0
    ORDER BY r.CollectionDate, r.CreatedAt;

    -- Result set 2: linii detaliu pentru toate buletinele de mai sus
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
    INNER JOIN dbo.AnalysesResults r ON r.Id = d.ResultId
    WHERE r.ConsultationId = @ConsultationId
      AND r.IsDeleted       = 0
      AND d.IsDeleted        = 0
    ORDER BY
        d.ResultId,
        d.Section,
        CASE
            WHEN d.Flag IS NULL          THEN 0   -- normale
            WHEN d.Flag IN ('LOW','HIGH') THEN 1   -- patologice
            ELSE                               2   -- critice (CHECK)
        END,
        d.TestName;
END;
GO
