SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_CheckConflict
-- Descriere: Verifică dacă există conflict de orar pentru un doctor
-- Returnează: COUNT(*) — 0 înseamnă fără conflict
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_CheckConflict
    @ClinicId    UNIQUEIDENTIFIER,
    @DoctorId    UNIQUEIDENTIFIER,
    @StartTime   DATETIME2(0),
    @EndTime     DATETIME2(0),
    @ExcludeId   UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT COUNT(*)
    FROM dbo.Appointments
    WHERE ClinicId = @ClinicId
      AND DoctorId = @DoctorId
      AND IsDeleted = 0
      AND (@ExcludeId IS NULL OR Id <> @ExcludeId)
      AND StartTime < @EndTime
      AND EndTime > @StartTime;
END;
GO
