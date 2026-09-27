SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_GetByDoctor
-- Descriere: Returnează programările unui doctor într-un interval de date (scheduler)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_GetByDoctor
    @ClinicId  UNIQUEIDENTIFIER,
    @DateFrom  DATETIME2(0),
    @DateTo    DATETIME2(0),
    @DoctorId  UNIQUEIDENTIFIER = NULL
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
        s.BlocksSlot,
        a.Notes
    FROM dbo.Appointments a
    INNER JOIN dbo.Patients p ON p.Id = a.PatientId
    INNER JOIN dbo.Doctors d  ON d.Id = a.DoctorId
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    WHERE a.ClinicId = @ClinicId
      AND a.IsDeleted = 0
      -- suprapunere de interval: include și programările începute înainte de @DateFrom
      AND a.StartTime < DATEADD(DAY, 1, @DateTo)
      AND a.EndTime   > @DateFrom
      AND (@DoctorId IS NULL OR a.DoctorId = @DoctorId)
    ORDER BY a.StartTime, a.Id;
END;
GO
