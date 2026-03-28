SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_GetPaged
-- Descriere: Returnează programări paginate cu filtre + total count + statistici
-- Result sets: (1) items paginate, (2) totalCount, (3) statistici
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_GetPaged
    @ClinicId   UNIQUEIDENTIFIER,
    @Search     NVARCHAR(200) = NULL,
    @DoctorId   UNIQUEIDENTIFIER = NULL,
    @StatusId   UNIQUEIDENTIFIER = NULL,
    @DateFrom   DATETIME2(0) = NULL,
    @DateTo     DATETIME2(0) = NULL,
    @Page       INT = 1,
    @PageSize   INT = 20,
    @SortBy     NVARCHAR(50) = 'StartTime',
    @SortDir    NVARCHAR(4) = 'desc'
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH FilteredAppointments AS (
        SELECT
            a.Id, a.ClinicId, a.PatientId, a.DoctorId,
            a.StartTime, a.EndTime, a.StatusId, a.Notes,
            a.IsDeleted, a.CreatedAt, a.CreatedBy,
            CONCAT(p.LastName, ' ', p.FirstName) AS PatientName,
            p.PhoneNumber AS PatientPhone,
            CONCAT(d.LastName, ' ', d.FirstName) AS DoctorName,
            sp.Name AS SpecialtyName,
            s.Name AS StatusName,
            s.Code AS StatusCode,
            CONCAT(cu.LastName, ' ', cu.FirstName) AS CreatedByName
        FROM dbo.Appointments a
        INNER JOIN dbo.Patients p  ON p.Id = a.PatientId
        INNER JOIN dbo.Doctors d   ON d.Id = a.DoctorId
        LEFT  JOIN dbo.Specialties sp ON sp.Id = d.SpecialtyId
        INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
        LEFT  JOIN dbo.Users cu ON cu.Id = a.CreatedBy
        WHERE a.ClinicId = @ClinicId
          AND a.IsDeleted = 0
          AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
          AND (@StatusId IS NULL OR a.StatusId = @StatusId)
          AND (@DateFrom IS NULL OR a.StartTime >= @DateFrom)
          AND (@DateTo   IS NULL OR a.StartTime < DATEADD(DAY, 1, @DateTo))
          AND (@Search IS NULL OR @Search = ''
               OR CONCAT(p.LastName, ' ', p.FirstName) LIKE '%' + @Search + '%'
               OR CONCAT(d.LastName, ' ', d.FirstName) LIKE '%' + @Search + '%'
               OR a.Notes LIKE '%' + @Search + '%')
    )

    -- Result set 1: pagină curentă
    SELECT Id, ClinicId, PatientId, DoctorId, StartTime, EndTime, StatusId, Notes,
           IsDeleted, CreatedAt, CreatedBy, PatientName, PatientPhone, DoctorName,
           SpecialtyName, StatusName, StatusCode, CreatedByName
    FROM FilteredAppointments
    ORDER BY
        CASE WHEN @SortDir = 'asc' THEN
            CASE @SortBy
                WHEN 'PatientName' THEN PatientName
                WHEN 'DoctorName'  THEN DoctorName
                WHEN 'StatusName'  THEN StatusName
                WHEN 'StartTime'   THEN CONVERT(NVARCHAR(30), StartTime, 126)
                WHEN 'CreatedAt'   THEN CONVERT(NVARCHAR(30), CreatedAt, 126)
                ELSE CONVERT(NVARCHAR(30), StartTime, 126)
            END
        END ASC,
        CASE WHEN @SortDir = 'desc' THEN
            CASE @SortBy
                WHEN 'PatientName' THEN PatientName
                WHEN 'DoctorName'  THEN DoctorName
                WHEN 'StatusName'  THEN StatusName
                WHEN 'StartTime'   THEN CONVERT(NVARCHAR(30), StartTime, 126)
                WHEN 'CreatedAt'   THEN CONVERT(NVARCHAR(30), CreatedAt, 126)
                ELSE CONVERT(NVARCHAR(30), StartTime, 126)
            END
        END DESC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Result set 2: total count
    SELECT COUNT(*)
    FROM dbo.Appointments a
    WHERE a.ClinicId = @ClinicId
      AND a.IsDeleted = 0
      AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
      AND (@StatusId IS NULL OR a.StatusId = @StatusId)
      AND (@DateFrom IS NULL OR a.StartTime >= @DateFrom)
      AND (@DateTo   IS NULL OR a.StartTime < DATEADD(DAY, 1, @DateTo))
      AND (@Search IS NULL OR @Search = ''
           OR EXISTS (SELECT 1 FROM dbo.Patients p WHERE p.Id = a.PatientId AND CONCAT(p.LastName, ' ', p.FirstName) LIKE '%' + @Search + '%')
           OR EXISTS (SELECT 1 FROM dbo.Doctors d WHERE d.Id = a.DoctorId AND CONCAT(d.LastName, ' ', d.FirstName) LIKE '%' + @Search + '%')
           OR a.Notes LIKE '%' + @Search + '%');

    -- Result set 3: statistici globale clinică
    SELECT
        COUNT(*) AS TotalAppointments,
        SUM(CASE WHEN s.Code = 'PROGRAMAT'  THEN 1 ELSE 0 END) AS ScheduledCount,
        SUM(CASE WHEN s.Code = 'CONFIRMAT'  THEN 1 ELSE 0 END) AS ConfirmedCount,
        SUM(CASE WHEN s.Code = 'FINALIZAT'  THEN 1 ELSE 0 END) AS CompletedCount,
        SUM(CASE WHEN s.Code = 'ANULAT'     THEN 1 ELSE 0 END) AS CancelledCount
    FROM dbo.Appointments a
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    WHERE a.ClinicId = @ClinicId AND a.IsDeleted = 0;
END;
GO
