-- ============================================================
-- DoctorSchedule_GetByDoctor — program unui singur medic
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.DoctorSchedule_GetByDoctor
    @DoctorId UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        ds.Id,
        ds.DoctorId,
        ds.DayOfWeek,
        CONVERT(VARCHAR(5), ds.StartTime, 108) AS StartTime,
        CONVERT(VARCHAR(5), ds.EndTime,   108) AS EndTime
    FROM dbo.DoctorSchedule ds
    WHERE ds.DoctorId = @DoctorId
      AND ds.ClinicId = @ClinicId
    ORDER BY ds.DayOfWeek;
END;
GO
