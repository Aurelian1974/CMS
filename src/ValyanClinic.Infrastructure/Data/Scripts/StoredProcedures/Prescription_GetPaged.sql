SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Prescription_GetPaged
-- Lista paginată a rețetelor (compensate + simple) cu filtre și statistici.
-- Result sets: 1) rânduri  2) total  3) statistici (pe întreaga clinică)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Prescription_GetPaged
    @ClinicId           UNIQUEIDENTIFIER,
    @Search             NVARCHAR(200)    = NULL,
    @PrescriptionTypeId UNIQUEIDENTIFIER = NULL,
    @StatusId           UNIQUEIDENTIFIER = NULL,
    @DoctorId           UNIQUEIDENTIFIER = NULL,
    @PatientId          UNIQUEIDENTIFIER = NULL,
    @DateFrom           DATE             = NULL,
    @DateTo             DATE             = NULL,
    @Page               INT              = 1,
    @PageSize           INT              = 20,
    @SortBy             NVARCHAR(50)     = N'Date',
    @SortDir            NVARCHAR(4)      = N'desc'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Term NVARCHAR(210) = IIF(NULLIF(LTRIM(RTRIM(@Search)), N'') IS NULL, NULL,
                                      N'%' + LTRIM(RTRIM(@Search)) + N'%');
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    ;WITH Filtered AS (
        SELECT
            p.Id,
            p.Series,
            p.Number,
            p.IssueDate,
            p.CreatedAt,
            COALESCE(p.IssueDate, p.CreatedAt)                  AS SortDate,
            p.PrescriptionTypeId,
            t.Code                                              AS TypeCode,
            t.Name                                              AS TypeName,
            t.IsCnas,
            p.StatusId,
            s.Code                                              AS StatusCode,
            s.Name                                              AS StatusName,
            p.PatientId,
            CONCAT(pa.LastName, N' ', pa.FirstName)             AS PatientName,
            pa.Cnp                                              AS PatientCnp,
            p.DoctorId,
            CONCAT(d.LastName, N' ', d.FirstName)               AS DoctorName,
            p.ConsultationId,
            ct.Name                                             AS CareTypeName,
            p.TreatmentDays,
            p.Diagnostic,
            p.DiagnosticCodes,
            p.NhpCode,
            p.ValidUntil,
            CAST(IIF(p.ValidUntil < @Today AND s.Code IN (N'EMISA', N'TRANSMISA'), 1, 0) AS BIT) AS IsExpired,
            p.ElectronicId,
            (SELECT COUNT(*) FROM dbo.PrescriptionItems pi
             WHERE pi.PrescriptionId = p.Id AND pi.IsDeleted = 0)  AS ItemCount
        FROM dbo.Prescriptions p
        INNER JOIN dbo.PrescriptionTypes t       ON t.Id = p.PrescriptionTypeId
        INNER JOIN dbo.PrescriptionStatuses s    ON s.Id = p.StatusId
        INNER JOIN dbo.Patients pa               ON pa.Id = p.PatientId AND pa.IsDeleted = 0
        INNER JOIN dbo.Doctors d                 ON d.Id = p.DoctorId
        LEFT  JOIN dbo.PrescriptionCareTypes ct  ON ct.Id = p.CareTypeId
        WHERE p.ClinicId = @ClinicId
          AND p.IsDeleted = 0
          AND (@PrescriptionTypeId IS NULL OR p.PrescriptionTypeId = @PrescriptionTypeId)
          AND (@StatusId  IS NULL OR p.StatusId  = @StatusId)
          AND (@DoctorId  IS NULL OR p.DoctorId  = @DoctorId)
          AND (@PatientId IS NULL OR p.PatientId = @PatientId)
          AND (@DateFrom  IS NULL OR COALESCE(p.IssueDate, p.CreatedAt) >= @DateFrom)
          AND (@DateTo    IS NULL OR COALESCE(p.IssueDate, p.CreatedAt) <  DATEADD(DAY, 1, @DateTo))
          AND (@Term IS NULL
               OR CONCAT(pa.LastName, N' ', pa.FirstName) COLLATE Latin1_General_CI_AI LIKE @Term
               OR CONCAT(pa.FirstName, N' ', pa.LastName) COLLATE Latin1_General_CI_AI LIKE @Term
               OR pa.Cnp LIKE @Term
               OR CONCAT(p.Series, N' ', p.Number) COLLATE Latin1_General_CI_AI LIKE @Term
               OR CONCAT(p.Series, p.Number) COLLATE Latin1_General_CI_AI LIKE @Term
               OR p.ElectronicId LIKE @Term
               OR p.Diagnostic COLLATE Latin1_General_CI_AI LIKE @Term
               OR p.DiagnosticCodes COLLATE Latin1_General_CI_AI LIKE @Term)
    )
    SELECT *
    FROM Filtered
    ORDER BY
        CASE WHEN @SortBy = N'PatientName' AND @SortDir = N'asc'  THEN PatientName END ASC,
        CASE WHEN @SortBy = N'PatientName' AND @SortDir = N'desc' THEN PatientName END DESC,
        CASE WHEN @SortBy = N'DoctorName'  AND @SortDir = N'asc'  THEN DoctorName  END ASC,
        CASE WHEN @SortBy = N'DoctorName'  AND @SortDir = N'desc' THEN DoctorName  END DESC,
        CASE WHEN @SortBy = N'Number'      AND @SortDir = N'asc'  THEN Number      END ASC,
        CASE WHEN @SortBy = N'Number'      AND @SortDir = N'desc' THEN Number      END DESC,
        CASE WHEN @SortBy = N'ValidUntil'  AND @SortDir = N'asc'  THEN ValidUntil  END ASC,
        CASE WHEN @SortBy = N'ValidUntil'  AND @SortDir = N'desc' THEN ValidUntil  END DESC,
        CASE WHEN @SortBy = N'TypeName'    AND @SortDir = N'asc'  THEN TypeName    END ASC,
        CASE WHEN @SortBy = N'TypeName'    AND @SortDir = N'desc' THEN TypeName    END DESC,
        CASE WHEN @SortBy = N'StatusName'  AND @SortDir = N'asc'  THEN StatusName  END ASC,
        CASE WHEN @SortBy = N'StatusName'  AND @SortDir = N'desc' THEN StatusName  END DESC,
        CASE WHEN @SortDir = N'asc'  THEN SortDate END ASC,
        CASE WHEN @SortDir <> N'asc' THEN SortDate END DESC,
        Id
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT COUNT(*)
    FROM dbo.Prescriptions p
    INNER JOIN dbo.Patients pa ON pa.Id = p.PatientId AND pa.IsDeleted = 0
    WHERE p.ClinicId = @ClinicId
      AND p.IsDeleted = 0
      AND (@PrescriptionTypeId IS NULL OR p.PrescriptionTypeId = @PrescriptionTypeId)
      AND (@StatusId  IS NULL OR p.StatusId  = @StatusId)
      AND (@DoctorId  IS NULL OR p.DoctorId  = @DoctorId)
      AND (@PatientId IS NULL OR p.PatientId = @PatientId)
      AND (@DateFrom  IS NULL OR COALESCE(p.IssueDate, p.CreatedAt) >= @DateFrom)
      AND (@DateTo    IS NULL OR COALESCE(p.IssueDate, p.CreatedAt) <  DATEADD(DAY, 1, @DateTo))
      AND (@Term IS NULL
           OR CONCAT(pa.LastName, N' ', pa.FirstName) COLLATE Latin1_General_CI_AI LIKE @Term
           OR CONCAT(pa.FirstName, N' ', pa.LastName) COLLATE Latin1_General_CI_AI LIKE @Term
           OR pa.Cnp LIKE @Term
           OR CONCAT(p.Series, N' ', p.Number) COLLATE Latin1_General_CI_AI LIKE @Term
           OR CONCAT(p.Series, p.Number) COLLATE Latin1_General_CI_AI LIKE @Term
           OR p.ElectronicId LIKE @Term
           OR p.Diagnostic COLLATE Latin1_General_CI_AI LIKE @Term
           OR p.DiagnosticCodes COLLATE Latin1_General_CI_AI LIKE @Term);

    DECLARE @MonthStart DATE = DATEFROMPARTS(YEAR(@Today), MONTH(@Today), 1);

    SELECT
        COUNT(*)                                                       AS TotalPrescriptions,
        ISNULL(SUM(IIF(t.IsCnas = 1, 1, 0)), 0)                        AS CompensatedCount,
        ISNULL(SUM(IIF(t.IsCnas = 0, 1, 0)), 0)                        AS SimpleCount,
        ISNULL(SUM(IIF(s.Code = N'CIORNA', 1, 0)), 0)                  AS DraftCount,
        ISNULL(SUM(IIF(p.IssueDate >= @MonthStart AND s.Code <> N'ANULATA', 1, 0)), 0) AS IssuedThisMonth
    FROM dbo.Prescriptions p
    INNER JOIN dbo.PrescriptionTypes t    ON t.Id = p.PrescriptionTypeId
    INNER JOIN dbo.PrescriptionStatuses s ON s.Id = p.StatusId
    WHERE p.ClinicId = @ClinicId AND p.IsDeleted = 0;
END;
GO
