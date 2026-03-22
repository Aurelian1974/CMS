-- ============================================================
-- DoctorSchedule_GetByClinic — toate programele medicilor din clinică
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.DoctorSchedule_GetByClinic
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ds.Id,
        ds.ClinicId,
        ds.DoctorId,
        d.FirstName + ' ' + d.LastName AS DoctorName,
        sp.Name AS SpecialtyName,
        ds.DayOfWeek,
        CONVERT(VARCHAR(5), ds.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), ds.EndTime,   108) AS EndTime
    FROM dbo.DoctorSchedule ds
    INNER JOIN dbo.Doctors d   ON d.Id  = ds.DoctorId AND d.IsDeleted = 0
    LEFT  JOIN dbo.Specialties sp ON sp.Id = d.SpecialtyId
    WHERE ds.ClinicId = @ClinicId
    ORDER BY d.LastName, d.FirstName, ds.DayOfWeek;
END;
GO
