-- ============================================================
-- DoctorSchedule_GetByClinic — toate programele medicilor din clinică
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.DoctorSchedule_GetByClinic
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Returnăm TOȚI medicii clinicii, chiar dacă nu au zile configurate (LEFT JOIN)
    SELECT
        ds.Id,
        @ClinicId          AS ClinicId,
        d.Id               AS DoctorId,
        d.FirstName + ' ' + d.LastName AS DoctorName,
        sp.Name            AS SpecialtyName,
        ds.DayOfWeek,
        CONVERT(VARCHAR(5), ds.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), ds.EndTime,   108) AS EndTime
    FROM dbo.Doctors d
    LEFT  JOIN dbo.DoctorSchedule ds ON ds.DoctorId = d.Id AND ds.ClinicId = @ClinicId
    LEFT  JOIN dbo.Specialties sp    ON sp.Id = d.SpecialtyId
    WHERE d.ClinicId = @ClinicId AND d.IsDeleted = 0
    ORDER BY d.LastName, d.FirstName, ds.DayOfWeek;
END;
GO
