SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_GetById
-- Descriere: Returnează o programare după Id și ClinicId
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        a.Id, a.ClinicId, a.PatientId,
        CONCAT(p.LastName, ' ', p.FirstName) AS PatientName,
        p.PhoneNumber AS PatientPhone,
        p.Cnp AS PatientCnp,
        p.Email AS PatientEmail,
        a.DoctorId,
        CONCAT(d.LastName, ' ', d.FirstName) AS DoctorName,
        sp.Name AS SpecialtyName,
        d.MedicalCode AS DoctorMedicalCode,
        a.StartTime, a.EndTime,
        a.StatusId, s.Name AS StatusName, s.Code AS StatusCode,
        a.Notes, a.IsDeleted, a.CreatedAt,
        CONCAT(cu.LastName, ' ', cu.FirstName) AS CreatedByName,
        a.UpdatedAt, a.UpdatedBy,
        CONCAT(uu.LastName, ' ', uu.FirstName) AS UpdatedByName
    FROM dbo.Appointments a
    INNER JOIN dbo.Patients p ON p.Id = a.PatientId
    INNER JOIN dbo.Doctors d  ON d.Id = a.DoctorId
    LEFT  JOIN dbo.Specialties sp ON sp.Id = d.SpecialtyId
    INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
    LEFT  JOIN dbo.Users cu ON cu.Id = a.CreatedBy
    LEFT  JOIN dbo.Users uu ON uu.Id = a.UpdatedBy
    WHERE a.Id = @Id AND a.ClinicId = @ClinicId AND a.IsDeleted = 0;
END;
GO
