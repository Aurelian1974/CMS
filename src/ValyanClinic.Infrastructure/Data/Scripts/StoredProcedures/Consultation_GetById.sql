SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Consultation_GetById
-- Descriere: Returnează o consultație după Id și ClinicId (detaliu complet)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        c.Id, c.ClinicId, c.PatientId,
        CONCAT(p.LastName, ' ', p.FirstName) AS PatientName,
        p.PhoneNumber AS PatientPhone,
        p.Cnp AS PatientCnp,
        p.Email AS PatientEmail,
        p.BirthDate AS PatientBirthDate,
        g.Name AS PatientGender,
        c.DoctorId,
        CONCAT(d.LastName, ' ', d.FirstName) AS DoctorName,
        sp.Name AS SpecialtyName,
        d.MedicalCode AS DoctorMedicalCode,
        c.AppointmentId,
        c.Date,
        -- Tab 1: Anamneză
        c.Motiv, c.IstoricMedicalPersonal, c.TratamentAnterior,
        c.IstoricBoalaActuala, c.IstoricFamilial, c.FactoriDeRisc, c.AlergiiConsultatie,
        -- Tab 2: Examen Clinic
        c.StareGenerala, c.Tegumente, c.Mucoase,
        c.Greutate, c.Inaltime,
        c.TensiuneSistolica, c.TensiuneDiastolica, c.Puls, c.FrecventaRespiratorie,
        c.Temperatura, c.SpO2, c.Edeme, c.Glicemie, c.GanglioniLimfatici,
        c.ExamenClinic, c.AlteObservatiiClinice,
        -- Tab 3: Investigații
        c.Investigatii,
        -- Tab 4: Analize Medicale
        c.AnalizeMedicale,
        -- Tab 5: Diagnostic & Tratament
        c.Diagnostic, c.DiagnosticCodes, c.Recomandari, c.Observatii,
        -- Tab 6: Concluzii
        c.Concluzii,
        c.EsteAfectiuneOncologica, c.AreIndicatieInternare,
        c.SaEliberatPrescriptie, c.SeriePrescriptie,
        c.SaEliberatConcediuMedical, c.SerieConcediuMedical,
        c.SaEliberatIngrijiriDomiciliu, c.SaEliberatDispozitiveMedicale,
        c.DataUrmatoareiVizite, c.NoteUrmatoareaVizita,
        c.StatusId, s.Name AS StatusName, s.Code AS StatusCode,
        c.IsDeleted, c.CreatedAt,
        CONCAT(cu.LastName, ' ', cu.FirstName) AS CreatedByName,
        c.UpdatedAt, c.UpdatedBy,
        CONCAT(uu.LastName, ' ', uu.FirstName) AS UpdatedByName
    FROM dbo.Consultations c
    INNER JOIN dbo.Patients p ON p.Id = c.PatientId
    LEFT  JOIN dbo.Genders g  ON g.Id = p.GenderId
    INNER JOIN dbo.Doctors d  ON d.Id = c.DoctorId
    LEFT  JOIN dbo.Specialties sp ON sp.Id = d.SpecialtyId
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
    LEFT  JOIN dbo.Users cu ON cu.Id = c.CreatedBy
    LEFT  JOIN dbo.Users uu ON uu.Id = c.UpdatedBy
    WHERE c.Id = @Id AND c.ClinicId = @ClinicId AND c.IsDeleted = 0;
END;
GO
