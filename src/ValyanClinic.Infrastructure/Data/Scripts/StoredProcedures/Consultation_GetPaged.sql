SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Consultation_GetPaged
-- Descriere: Returnează consultații paginate cu filtre + total count + statistici
-- Result sets: (1) items paginate, (2) totalCount, (3) statistici
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_GetPaged
    @ClinicId   UNIQUEIDENTIFIER,
    @Search     NVARCHAR(200) = NULL,
    @DoctorId   UNIQUEIDENTIFIER = NULL,
    @StatusId   UNIQUEIDENTIFIER = NULL,
    @DateFrom   DATETIME2(0) = NULL,
    @DateTo     DATETIME2(0) = NULL,
    @Page       INT = 1,
    @PageSize   INT = 20,
    @SortBy     NVARCHAR(50) = 'Date',
    @SortDir    NVARCHAR(4) = 'desc'
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH FilteredConsultations AS (
        SELECT
            c.Id, c.ClinicId, c.PatientId, c.DoctorId,
            c.Date, c.Diagnostic, c.DiagnosticCodes,
            c.StatusId, c.IsDeleted, c.CreatedAt, c.CreatedBy,
            CONCAT(p.LastName, ' ', p.FirstName) AS PatientName,
            p.PhoneNumber AS PatientPhone,
            CONCAT(d.LastName, ' ', d.FirstName) AS DoctorName,
            sp.Name AS SpecialtyName,
            s.Name AS StatusName,
            s.Code AS StatusCode,
            CONCAT(cu.LastName, ' ', cu.FirstName) AS CreatedByName
        FROM dbo.Consultations c
        INNER JOIN dbo.Patients p  ON p.Id = c.PatientId
        INNER JOIN dbo.Doctors d   ON d.Id = c.DoctorId
        LEFT  JOIN dbo.Specialties sp ON sp.Id = d.SpecialtyId
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        LEFT  JOIN dbo.Users cu ON cu.Id = c.CreatedBy
        WHERE c.ClinicId = @ClinicId
          AND c.IsDeleted = 0
          AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId)
          AND (@StatusId IS NULL OR c.StatusId = @StatusId)
          AND (@DateFrom IS NULL OR c.Date >= @DateFrom)
          AND (@DateTo   IS NULL OR c.Date < DATEADD(DAY, 1, @DateTo))
          AND (@Search IS NULL OR @Search = ''
               OR CONCAT(p.LastName, ' ', p.FirstName) LIKE '%' + @Search + '%'
               OR CONCAT(d.LastName, ' ', d.FirstName) LIKE '%' + @Search + '%'
               OR c.Diagnostic LIKE '%' + @Search + '%')
    )

    -- Result set 1: pagină curentă
    SELECT Id, ClinicId, PatientId, DoctorId, Date, Diagnostic, DiagnosticCodes,
           StatusId, IsDeleted, CreatedAt, CreatedBy, PatientName, PatientPhone,
           DoctorName, SpecialtyName, StatusName, StatusCode, CreatedByName
    FROM FilteredConsultations
    ORDER BY
        CASE WHEN @SortDir = 'asc' THEN
            CASE @SortBy
                WHEN 'PatientName' THEN PatientName
                WHEN 'DoctorName'  THEN DoctorName
                WHEN 'StatusName'  THEN StatusName
                WHEN 'Date'        THEN CONVERT(NVARCHAR(30), Date, 126)
                WHEN 'CreatedAt'   THEN CONVERT(NVARCHAR(30), CreatedAt, 126)
                ELSE CONVERT(NVARCHAR(30), Date, 126)
            END
        END ASC,
        CASE WHEN @SortDir = 'desc' THEN
            CASE @SortBy
                WHEN 'PatientName' THEN PatientName
                WHEN 'DoctorName'  THEN DoctorName
                WHEN 'StatusName'  THEN StatusName
                WHEN 'Date'        THEN CONVERT(NVARCHAR(30), Date, 126)
                WHEN 'CreatedAt'   THEN CONVERT(NVARCHAR(30), CreatedAt, 126)
                ELSE CONVERT(NVARCHAR(30), Date, 126)
            END
        END DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Result set 2: total count
    SELECT COUNT(*)
    FROM dbo.Consultations c
    WHERE c.ClinicId = @ClinicId
      AND c.IsDeleted = 0
      AND (@DoctorId IS NULL OR c.DoctorId = @DoctorId)
      AND (@StatusId IS NULL OR c.StatusId = @StatusId)
      AND (@DateFrom IS NULL OR c.Date >= @DateFrom)
      AND (@DateTo   IS NULL OR c.Date < DATEADD(DAY, 1, @DateTo))
      AND (@Search IS NULL OR @Search = ''
           OR EXISTS (SELECT 1 FROM dbo.Patients p WHERE p.Id = c.PatientId AND CONCAT(p.LastName, ' ', p.FirstName) LIKE '%' + @Search + '%')
           OR EXISTS (SELECT 1 FROM dbo.Doctors d WHERE d.Id = c.DoctorId AND CONCAT(d.LastName, ' ', d.FirstName) LIKE '%' + @Search + '%')
           OR c.Diagnostic LIKE '%' + @Search + '%');

    -- Result set 3: statistici globale clinică
    SELECT
        COUNT(*) AS TotalConsultations,
        SUM(CASE WHEN s.Code = 'INLUCRU'    THEN 1 ELSE 0 END) AS DraftCount,
        SUM(CASE WHEN s.Code = 'FINALIZATA' THEN 1 ELSE 0 END) AS CompletedCount,
        SUM(CASE WHEN s.Code = 'BLOCATA'    THEN 1 ELSE 0 END) AS LockedCount
    FROM dbo.Consultations c
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
    WHERE c.ClinicId = @ClinicId AND c.IsDeleted = 0;
END;
GO
