SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_GetByPatient
-- Descriere: Returnează programările unui pacient, ordonate descrescător după dată
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_GetByPatient
    @ClinicId   UNIQUEIDENTIFIER,
    @PatientId  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.Id, a.PatientId,
        CONCAT(p.LastName, ' ', p.FirstName) AS PatientName,
        a.DoctorId,
        CONCAT(d.LastName, ' ', d.FirstName) AS DoctorName,
        a.StartTime, a.EndTime,
        a.StatusId, s.Name AS StatusName, s.Code AS StatusCode,
        a.Notes
    FROM dbo.Appointments a
    INNER JOIN dbo.Patients p ON p.Id = a.PatientId
    INNER JOIN dbo.Doctors d  ON d.Id = a.DoctorId
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    WHERE a.ClinicId = @ClinicId
      AND a.PatientId = @PatientId
      AND a.IsDeleted = 0
    ORDER BY a.StartTime DESC;
END;
GO
