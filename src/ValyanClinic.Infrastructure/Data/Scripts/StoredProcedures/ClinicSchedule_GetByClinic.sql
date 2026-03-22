-- ============================================================
-- ClinicSchedule_GetByClinic — program clinică (toate zilele)
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.ClinicSchedule_GetByClinic
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        cs.Id,
        cs.ClinicId,
        cs.DayOfWeek,
        cs.IsOpen,
        CONVERT(VARCHAR(5), cs.OpenTime,  108) AS OpenTime,
        CONVERT(VARCHAR(5), cs.CloseTime, 108) AS CloseTime
    FROM dbo.ClinicSchedule cs
    WHERE cs.ClinicId = @ClinicId
    ORDER BY cs.DayOfWeek;
END;
GO
