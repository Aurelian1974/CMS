SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Consultation_GetByPatient
-- Descriere: Returnează consultațiile unui pacient, ordonate descrescător după dată
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_GetByPatient
    @ClinicId   UNIQUEIDENTIFIER,
    @PatientId  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.Id, c.ClinicId, c.PatientId,
        CONCAT(p.LastName, ' ', p.FirstName) AS PatientName,
        p.PhoneNumber AS PatientPhone,
        c.DoctorId,
        CONCAT(d.LastName, ' ', d.FirstName) AS DoctorName,
        sp.Name AS SpecialtyName,
        c.Date, c.Diagnostic, c.DiagnosticCodes,
        c.StatusId, s.Name AS StatusName, s.Code AS StatusCode,
        c.IsDeleted, c.CreatedAt,
        CONCAT(cu.LastName, ' ', cu.FirstName) AS CreatedByName
    FROM dbo.Consultations c
    INNER JOIN dbo.Patients p ON p.Id = c.PatientId
    INNER JOIN dbo.Doctors d  ON d.Id = c.DoctorId
    LEFT  JOIN dbo.Specialties sp ON sp.Id = d.SpecialtyId
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
    LEFT  JOIN dbo.Users cu ON cu.Id = c.CreatedBy
    WHERE c.ClinicId = @ClinicId
      AND c.PatientId = @PatientId
      AND c.IsDeleted = 0
    ORDER BY c.Date DESC;
END;
GO
