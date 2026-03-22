-- ============================================================
-- DoctorSchedule_Delete — șterge o zi din programul medicului
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.DoctorSchedule_Delete
    @DoctorId  UNIQUEIDENTIFIER,
    @DayOfWeek TINYINT,
    @ClinicId  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    DELETE FROM dbo.DoctorSchedule
    WHERE DoctorId = @DoctorId
      AND DayOfWeek = @DayOfWeek
      AND ClinicId  = @ClinicId;
END;
GO
