SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_GetByPatient
-- Descriere: Istoricul programărilor unui pacient (cele mai recente primele)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_GetByPatient
    @ClinicId   UNIQUEIDENTIFIER,
    @PatientId  UNIQUEIDENTIFIER,
    @Take       INT = 100
AS
BEGIN
    SET NOCOUNT ON;

    SET @Take = CASE WHEN ISNULL(@Take, 100) < 1 THEN 100 WHEN @Take > 500 THEN 500 ELSE @Take END;

    SELECT TOP (@Take)
        a.Id, a.PatientId,
        CONCAT(p.LastName, N' ', p.FirstName) AS PatientName,
        a.DoctorId,
        CONCAT(d.LastName, N' ', d.FirstName) AS DoctorName,
        a.StartTime, a.EndTime,
        a.StatusId, s.Name AS StatusName, s.Code AS StatusCode,
        s.BlocksSlot,
        a.Notes
    FROM dbo.Appointments a
    INNER JOIN dbo.Patients p ON p.Id = a.PatientId
    INNER JOIN dbo.Doctors d  ON d.Id = a.DoctorId
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    WHERE a.ClinicId  = @ClinicId
      AND a.PatientId = @PatientId
      AND a.IsDeleted = 0
    ORDER BY a.StartTime DESC, a.Id DESC;
END;
GO
