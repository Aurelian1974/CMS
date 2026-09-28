SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Consultation_GetPaged
-- Descriere: Returnează consultații paginate cu filtre + total count + statistici
-- Result sets: (1) pagina curentă, (2) totalCount, (3) statistici pe setul FILTRAT
-- Filtrele se scriu o singură dată (#Filtered) și sunt reutilizate de toate seturile.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_GetPaged
    @ClinicId   UNIQUEIDENTIFIER,
    @Search     NVARCHAR(200)    = NULL,
    @DoctorId   UNIQUEIDENTIFIER = NULL,
    @StatusId   UNIQUEIDENTIFIER = NULL,
    @StatusCode NVARCHAR(50)     = NULL,
    @DateFrom   DATETIME2(0)     = NULL,
    @DateTo     DATETIME2(0)     = NULL,
    @Page       INT              = 1,
    @PageSize   INT              = 20,
    @SortBy     NVARCHAR(50)     = 'Date',
    @SortDir    NVARCHAR(4)      = 'desc'
AS
BEGIN
    SET NOCOUNT ON;

    -- OFFSET negativ = eroare de execuție; @SortBy necunoscut = sortare implicită
    SET @Page     = CASE WHEN @Page < 1 OR @Page IS NULL THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN @PageSize BETWEEN 1 AND 200 THEN @PageSize ELSE 20 END;
    SET @SortDir  = CASE WHEN LOWER(@SortDir) = 'asc' THEN 'asc' ELSE 'desc' END;
    SET @SortBy   = CASE WHEN @SortBy IN ('Date', 'PatientName', 'DoctorName', 'StatusName', 'CreatedAt')
                         THEN @SortBy ELSE 'Date' END;
    SET @Search   = NULLIF(LTRIM(RTRIM(@Search)), N'');
    SET @StatusCode = NULLIF(LTRIM(RTRIM(@StatusCode)), N'');

    -- Parantezele drepte fac %, _ și [ literale (fără clauză ESCAPE)
    DECLARE @Pattern NVARCHAR(620) = CASE WHEN @Search IS NULL THEN NULL ELSE
        N'%' + REPLACE(REPLACE(REPLACE(@Search, N'[', N'[[]'), N'%', N'[%]'), N'_', N'[_]') + N'%' END;

    -- @DateTo include ziua întreagă, indiferent de ora primită
    DECLARE @DateToExclusive DATETIME2(0) = CASE WHEN @DateTo IS NULL THEN NULL
        ELSE DATEADD(DAY, 1, CAST(CAST(@DateTo AS DATE) AS DATETIME2(0))) END;

    CREATE TABLE #Filtered (
        Id         UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
        StatusCode NVARCHAR(50)     NOT NULL
    );

    INSERT INTO #Filtered (Id, StatusCode)
    SELECT c.Id, s.Code
    FROM dbo.Consultations c
    INNER JOIN dbo.Patients p             ON p.Id = c.PatientId
    INNER JOIN dbo.Doctors  d             ON d.Id = c.DoctorId
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
    WHERE c.ClinicId = @ClinicId
      AND c.IsDeleted = 0
      AND (@DoctorId   IS NULL OR c.DoctorId = @DoctorId)
      AND (@StatusId   IS NULL OR c.StatusId = @StatusId)
      AND (@StatusCode IS NULL OR s.Code = @StatusCode)
      AND (@DateFrom   IS NULL OR c.Date >= @DateFrom)
      AND (@DateToExclusive IS NULL OR c.Date < @DateToExclusive)
      AND (@Pattern IS NULL
           OR CONCAT(p.LastName, N' ', p.FirstName) COLLATE Latin1_General_CI_AI LIKE @Pattern
           OR CONCAT(d.LastName, N' ', d.FirstName) COLLATE Latin1_General_CI_AI LIKE @Pattern
           -- Diagnostic text liber (rânduri fără coduri ICD-10)
           OR (ISJSON(c.Diagnostic) = 0 AND c.Diagnostic COLLATE Latin1_General_CI_AI LIKE @Pattern)
           OR EXISTS (SELECT 1 FROM dbo.ConsultationDiagnoses dg
                      WHERE dg.ConsultationId = c.Id
                        AND (dg.Icd10Code COLLATE Latin1_General_CI_AI LIKE @Pattern
                             OR dg.Icd10Description COLLATE Latin1_General_CI_AI LIKE @Pattern)))
    OPTION (RECOMPILE);

    -- Result set 1: pagina curentă
    SELECT
        c.Id, c.ClinicId, c.PatientId, c.DoctorId,
        c.Date, c.Diagnostic, c.DiagnosticCodes,
        c.StatusId, c.IsDeleted, c.CreatedAt, c.CreatedBy,
        CONCAT(p.LastName, N' ', p.FirstName) AS PatientName,
        p.PhoneNumber                         AS PatientPhone,
        CONCAT(d.LastName, N' ', d.FirstName) AS DoctorName,
        sp.Name AS SpecialtyName,
        s.Name  AS StatusName,
        s.Code  AS StatusCode,
        CONCAT(cu.LastName, N' ', cu.FirstName) AS CreatedByName
    FROM #Filtered f
    INNER JOIN dbo.Consultations c        ON c.Id = f.Id
    INNER JOIN dbo.Patients p             ON p.Id = c.PatientId
    INNER JOIN dbo.Doctors  d             ON d.Id = c.DoctorId
    LEFT  JOIN dbo.Specialties sp         ON sp.Id = d.SpecialtyId
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
    LEFT  JOIN dbo.Users cu               ON cu.Id = c.CreatedBy
    ORDER BY
        CASE WHEN @SortDir = 'asc'  AND @SortBy = 'Date'        THEN c.Date      END ASC,
        CASE WHEN @SortDir = 'desc' AND @SortBy = 'Date'        THEN c.Date      END DESC,
        CASE WHEN @SortDir = 'asc'  AND @SortBy = 'CreatedAt'   THEN c.CreatedAt END ASC,
        CASE WHEN @SortDir = 'desc' AND @SortBy = 'CreatedAt'   THEN c.CreatedAt END DESC,
        CASE WHEN @SortDir = 'asc'  AND @SortBy = 'PatientName' THEN CONCAT(p.LastName, N' ', p.FirstName) END ASC,
        CASE WHEN @SortDir = 'desc' AND @SortBy = 'PatientName' THEN CONCAT(p.LastName, N' ', p.FirstName) END DESC,
        CASE WHEN @SortDir = 'asc'  AND @SortBy = 'DoctorName'  THEN CONCAT(d.LastName, N' ', d.FirstName) END ASC,
        CASE WHEN @SortDir = 'desc' AND @SortBy = 'DoctorName'  THEN CONCAT(d.LastName, N' ', d.FirstName) END DESC,
        CASE WHEN @SortDir = 'asc'  AND @SortBy = 'StatusName'  THEN s.Name      END ASC,
        CASE WHEN @SortDir = 'desc' AND @SortBy = 'StatusName'  THEN s.Name      END DESC,
        c.Id   -- departajare stabilă: fără ea, paginarea poate repeta sau omite rânduri
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY
    OPTION (RECOMPILE);

    -- Result set 2: total count
    SELECT COUNT(*) FROM #Filtered;

    -- Result set 3: statistici pe setul filtrat (coerente cu lista afișată)
    SELECT
        COUNT(*)                                                   AS TotalConsultations,
        ISNULL(SUM(CASE WHEN StatusCode = 'INLUCRU'    THEN 1 ELSE 0 END), 0) AS DraftCount,
        ISNULL(SUM(CASE WHEN StatusCode = 'FINALIZATA' THEN 1 ELSE 0 END), 0) AS CompletedCount,
        ISNULL(SUM(CASE WHEN StatusCode = 'BLOCATA'    THEN 1 ELSE 0 END), 0) AS LockedCount
    FROM #Filtered;

    DROP TABLE #Filtered;
END;
GO
