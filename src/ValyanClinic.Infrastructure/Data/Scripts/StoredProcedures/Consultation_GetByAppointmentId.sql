SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Consultation_GetByAppointmentId
-- Descriere: Returnează o consultație (dacă există) după AppointmentId și ClinicId
-- Result sets: 1) Header, 2) Anamneză (0..1), 3) Examen Clinic (0..1)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_GetByAppointmentId
    @AppointmentId UNIQUEIDENTIFIER,
    @ClinicId      UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Id UNIQUEIDENTIFIER;
    SELECT @Id = Id
    FROM dbo.Consultations
    WHERE AppointmentId = @AppointmentId AND ClinicId = @ClinicId AND IsDeleted = 0;

    -- 1) Header
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
    WHERE c.Id = @Id;

    -- Dacă header gol, returnăm 2 result sets goale (Dapper așteaptă 3 fix)
    IF @Id IS NULL
    BEGIN
        SELECT TOP 0
            CAST(NULL AS NVARCHAR(MAX)) AS Motiv,
            CAST(NULL AS NVARCHAR(MAX)) AS IstoricMedicalPersonal,
            CAST(NULL AS NVARCHAR(MAX)) AS TratamentAnterior,
            CAST(NULL AS NVARCHAR(MAX)) AS IstoricBoalaActuala,
            CAST(NULL AS NVARCHAR(MAX)) AS IstoricFamilial,
            CAST(NULL AS NVARCHAR(MAX)) AS FactoriDeRisc,
            CAST(NULL AS NVARCHAR(MAX)) AS AlergiiConsultatie;

        SELECT TOP 0
            CAST(NULL AS NVARCHAR(50))  AS StareGenerala,
            CAST(NULL AS NVARCHAR(50))  AS Tegumente,
            CAST(NULL AS NVARCHAR(50))  AS Mucoase,
            CAST(NULL AS DECIMAL(5,1))  AS Greutate,
            CAST(NULL AS INT)           AS Inaltime,
            CAST(NULL AS INT)           AS TensiuneSistolica,
            CAST(NULL AS INT)           AS TensiuneDiastolica,
            CAST(NULL AS INT)           AS Puls,
            CAST(NULL AS INT)           AS FrecventaRespiratorie,
            CAST(NULL AS DECIMAL(4,1))  AS Temperatura,
            CAST(NULL AS INT)           AS SpO2,
            CAST(NULL AS NVARCHAR(50))  AS Edeme,
            CAST(NULL AS DECIMAL(6,1))  AS Glicemie,
            CAST(NULL AS NVARCHAR(100)) AS GanglioniLimfatici,
            CAST(NULL AS NVARCHAR(MAX)) AS ExamenClinic,
            CAST(NULL AS NVARCHAR(MAX)) AS AlteObservatiiClinice;
        RETURN;
    END;

    -- 2) Anamneză
    SELECT
        a.Motiv, a.IstoricMedicalPersonal, a.TratamentAnterior,
        a.IstoricBoalaActuala, a.IstoricFamilial, a.FactoriDeRisc, a.AlergiiConsultatie
    FROM dbo.ConsultationAnamnesis a WHERE a.ConsultationId = @Id;

    -- 3) Examen Clinic
    SELECT
        e.StareGenerala, e.Tegumente, e.Mucoase,
        e.Greutate, e.Inaltime,
        e.TensiuneSistolica, e.TensiuneDiastolica, e.Puls, e.FrecventaRespiratorie,
        e.Temperatura, e.SpO2, e.Edeme, e.Glicemie, e.GanglioniLimfatici,
        e.ExamenClinic, e.AlteObservatiiClinice
    FROM dbo.ConsultationExam e WHERE e.ConsultationId = @Id;
END;
GO
