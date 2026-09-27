SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_CheckConflict
-- Descriere: Programările care se suprapun cu intervalul dat pentru un doctor
--            (doar statusurile care ocupă slotul) — pentru avertizare în UI
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

    SELECT TOP (5)
        a.Id, a.StartTime, a.EndTime,
        CONCAT(p.LastName, N' ', p.FirstName) AS PatientName,
        s.Name AS StatusName
    FROM dbo.Appointments a
    INNER JOIN dbo.Patients p            ON p.Id = a.PatientId
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    WHERE a.ClinicId   = @ClinicId
      AND a.DoctorId   = @DoctorId
      AND a.IsDeleted  = 0
      AND s.BlocksSlot = 1
      AND (@ExcludeId IS NULL OR a.Id <> @ExcludeId)
      AND a.StartTime  < @EndTime
      AND a.EndTime    > @StartTime
    ORDER BY a.StartTime, a.Id;
END;
GO
