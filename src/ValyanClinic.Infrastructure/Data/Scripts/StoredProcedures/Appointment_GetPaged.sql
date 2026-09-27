SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_GetPaged
-- Result sets: (1) pagina curentă, (2) totalCount, (3) statistici pe selecție
-- Toate filtrele au o singură definiție (#Base); statisticile ignoră DOAR
-- filtrul de status, ca statusurile să rămână navigabile din carduri.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_GetPaged
    @ClinicId   UNIQUEIDENTIFIER,
    @Search     NVARCHAR(200)    = NULL,
    @DoctorId   UNIQUEIDENTIFIER = NULL,
    @StatusId   UNIQUEIDENTIFIER = NULL,
    @DateFrom   DATETIME2(0)     = NULL,
    @DateTo     DATETIME2(0)     = NULL,
    @Page       INT              = 1,
    @PageSize   INT              = 20,
    @SortBy     NVARCHAR(50)     = 'StartTime',
    @SortDir    NVARCHAR(4)      = 'desc'
AS
BEGIN
    SET NOCOUNT ON;

    SET @Page     = CASE WHEN ISNULL(@Page, 1) < 1 THEN 1 ELSE @Page END;
    SET @PageSize = CASE WHEN ISNULL(@PageSize, 20) < 1 THEN 20
                         WHEN @PageSize > 200          THEN 200
                         ELSE @PageSize END;

    -- Colația BD e case-sensitive → normalizare explicită
    SET @SortBy = CASE LOWER(LTRIM(RTRIM(ISNULL(@SortBy, N''))))
                    WHEN N'patientname' THEN N'PatientName'
                    WHEN N'doctorname'  THEN N'DoctorName'
                    WHEN N'statusname'  THEN N'StatusName'
                    WHEN N'createdat'   THEN N'CreatedAt'
                    ELSE N'StartTime'
                  END;
    SET @SortDir = CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(@SortDir, N'')))) = N'asc' THEN N'asc' ELSE N'desc' END;

    -- Escape pentru caracterele speciale LIKE: [ % _
    DECLARE @Pattern NVARCHAR(410) = NULL;
    IF NULLIF(LTRIM(RTRIM(@Search)), N'') IS NOT NULL
        SET @Pattern = N'%'
            + REPLACE(REPLACE(REPLACE(LTRIM(RTRIM(@Search)), N'[', N'[[]'), N'%', N'[%]'), N'_', N'[_]')
            + N'%';

    SELECT
        a.Id, a.ClinicId, a.PatientId, a.DoctorId,
        a.StartTime, a.EndTime, a.StatusId, a.Notes,
        a.IsDeleted, a.CreatedAt, a.CreatedBy,
        CONCAT(p.LastName, N' ', p.FirstName)   AS PatientName,
        p.PhoneNumber                           AS PatientPhone,
        CONCAT(d.LastName, N' ', d.FirstName)   AS DoctorName,
        sp.Name                                 AS SpecialtyName,
        s.Name                                  AS StatusName,
        s.Code                                  AS StatusCode,
        CONCAT(cu.LastName, N' ', cu.FirstName) AS CreatedByName,
        -- CAST: SELECT INTO ar crea o coloană rowversion nouă în #Base
        CAST(a.RowVersion AS BINARY(8))         AS RowVersion
    INTO #Base
    FROM dbo.Appointments a
    INNER JOIN dbo.Patients p            ON p.Id  = a.PatientId
    INNER JOIN dbo.Doctors d             ON d.Id  = a.DoctorId
    INNER JOIN dbo.AppointmentStatuses s ON s.Id  = a.StatusId
    LEFT  JOIN dbo.Specialties sp        ON sp.Id = d.SpecialtyId
    LEFT  JOIN dbo.Users cu              ON cu.Id = a.CreatedBy
    WHERE a.ClinicId  = @ClinicId
      AND a.IsDeleted = 0
      AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
      AND (@DateFrom IS NULL OR a.StartTime >= @DateFrom)
      AND (@DateTo   IS NULL OR a.StartTime <  DATEADD(DAY, 1, @DateTo))
      AND (@Pattern IS NULL
           OR CONCAT(p.LastName, N' ', p.FirstName) COLLATE Latin1_General_CI_AI LIKE @Pattern
           OR CONCAT(d.LastName, N' ', d.FirstName) COLLATE Latin1_General_CI_AI LIKE @Pattern
           OR a.Notes COLLATE Latin1_General_CI_AI LIKE @Pattern)
    OPTION (RECOMPILE);

    -- Result set 1: pagina curentă (tiebreaker pe Id → paginare stabilă)
    SELECT Id, ClinicId, PatientId, DoctorId, StartTime, EndTime, StatusId, Notes,
           IsDeleted, CreatedAt, CreatedBy, PatientName, PatientPhone, DoctorName,
           SpecialtyName, StatusName, StatusCode, CreatedByName, RowVersion
    FROM #Base
    WHERE (@StatusId IS NULL OR StatusId = @StatusId)
    ORDER BY
        CASE WHEN @SortDir = N'asc' THEN
            CASE @SortBy WHEN N'PatientName' THEN PatientName
                         WHEN N'DoctorName'  THEN DoctorName
                         WHEN N'StatusName'  THEN StatusName
                         WHEN N'CreatedAt'   THEN CONVERT(NVARCHAR(30), CreatedAt, 126)
                         ELSE CONVERT(NVARCHAR(30), StartTime, 126) END
        END ASC,
        CASE WHEN @SortDir = N'desc' THEN
            CASE @SortBy WHEN N'PatientName' THEN PatientName
                         WHEN N'DoctorName'  THEN DoctorName
                         WHEN N'StatusName'  THEN StatusName
                         WHEN N'CreatedAt'   THEN CONVERT(NVARCHAR(30), CreatedAt, 126)
                         ELSE CONVERT(NVARCHAR(30), StartTime, 126) END
        END DESC,
        Id ASC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    -- Result set 2: total count (aceleași filtre)
    SELECT COUNT(*) FROM #Base WHERE (@StatusId IS NULL OR StatusId = @StatusId);

    -- Result set 3: statistici pe selecție, fără filtrul de status
    SELECT
        COUNT(*)                                                             AS TotalAppointments,
        ISNULL(SUM(CASE WHEN StatusCode = 'PROGRAMAT'    THEN 1 ELSE 0 END), 0) AS ScheduledCount,
        ISNULL(SUM(CASE WHEN StatusCode = 'CONFIRMAT'    THEN 1 ELSE 0 END), 0) AS ConfirmedCount,
        ISNULL(SUM(CASE WHEN StatusCode = 'FINALIZAT'    THEN 1 ELSE 0 END), 0) AS CompletedCount,
        ISNULL(SUM(CASE WHEN StatusCode = 'ANULAT'       THEN 1 ELSE 0 END), 0) AS CancelledCount,
        ISNULL(SUM(CASE WHEN StatusCode = 'NEPREZENTARE' THEN 1 ELSE 0 END), 0) AS NoShowCount
    FROM #Base;

    DROP TABLE #Base;
END;
GO
