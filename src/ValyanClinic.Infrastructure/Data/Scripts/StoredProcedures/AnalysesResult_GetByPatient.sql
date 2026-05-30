SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: AnalysesResult_GetByPatient
-- Descriere: Toate buletinele unui pacient cu liniile detaliu.
--            Returneaza 2 result sets: headers + toate detaliile (join pe client).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.AnalysesResult_GetByPatient
    @PatientId UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DateFrom  DATE = NULL,
    @DateTo    DATE = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- Result set 1: headerele buletinelor
    SELECT
        r.Id,
        r.ClinicId,
        r.PatientId,
        r.ConsultationId,
        r.Laboratory,
        r.BulletinNumber,
        r.CollectionDate,
        r.ResultDate,
        r.DoctorName,
        r.CreatedAt
    FROM dbo.AnalysesResults r
    WHERE r.PatientId = @PatientId
      AND r.ClinicId  = @ClinicId
      AND r.IsDeleted = 0
      AND (@DateFrom IS NULL OR r.CollectionDate >= @DateFrom)
      AND (@DateTo   IS NULL OR r.CollectionDate <= @DateTo)
    ORDER BY r.CollectionDate DESC, r.CreatedAt DESC;

    -- Result set 2: toate liniile detaliu pentru buletinele returnate
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
        d.SortOrder
    FROM dbo.AnalysesResultDetails d
    INNER JOIN dbo.AnalysesResults r ON r.Id = d.ResultId
    WHERE r.PatientId = @PatientId
      AND r.ClinicId  = @ClinicId
      AND r.IsDeleted = 0
      AND d.IsDeleted = 0
      AND (@DateFrom IS NULL OR r.CollectionDate >= @DateFrom)
      AND (@DateTo   IS NULL OR r.CollectionDate <= @DateTo)
    ORDER BY r.CollectionDate DESC, d.SortOrder;
END;
GO
