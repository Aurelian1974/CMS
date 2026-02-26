-- ============================================================
-- Patient_GetById — detalii complete pacient
-- Result set 1: date pacient (+ audit names, age, totalVisits)
-- Result set 2: alergii
-- Result set 3: doctori asignați (+ telefon doctor)
-- Result set 4: contacte urgență
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.Patient_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Result set 1: date pacient cu audit names și vârstă
    SELECT
        p.Id,
        p.ClinicId,
        p.PatientCode,
        p.FirstName,
        p.LastName,
        p.FirstName + ' ' + p.LastName AS FullName,
        p.Cnp,
        p.BirthDate,
        CASE WHEN p.BirthDate IS NOT NULL
             THEN DATEDIFF(YEAR, p.BirthDate, GETDATE())
                  - CASE WHEN DATEADD(YEAR, DATEDIFF(YEAR, p.BirthDate, GETDATE()), p.BirthDate) > GETDATE()
                         THEN 1 ELSE 0 END
             ELSE NULL END AS Age,
        p.GenderId,
        g.Name                  AS GenderName,
        p.BloodTypeId,
        bt.Name                 AS BloodTypeName,
        p.PhoneNumber,
        p.SecondaryPhone,
        p.Email,
        p.Address,
        p.City,
        p.County,
        p.PostalCode,
        p.InsuranceNumber,
        p.InsuranceExpiry,
        p.IsInsured,
        p.ChronicDiseases,
        p.FamilyDoctorName,
        p.Notes,
        p.IsActive,
        -- Număr total vizite (consultații) — 0 până la implementarea modulului Consultations
        0 AS TotalVisits,
        -- Audit
        p.CreatedAt,
        p.CreatedBy,
        uc.FirstName + ' ' + uc.LastName AS CreatedByName,
        p.UpdatedAt,
        p.UpdatedBy,
        uu.FirstName + ' ' + uu.LastName AS UpdatedByName
    FROM Patients p
    LEFT JOIN Genders    g  ON g.Id  = p.GenderId    AND g.IsActive = 1
    LEFT JOIN BloodTypes bt ON bt.Id = p.BloodTypeId  AND bt.IsActive = 1
    LEFT JOIN Users      uc ON uc.Id = p.CreatedBy    AND uc.IsDeleted = 0
    LEFT JOIN Users      uu ON uu.Id = p.UpdatedBy    AND uu.IsDeleted = 0
    WHERE p.Id = @Id AND p.ClinicId = @ClinicId AND p.IsDeleted = 0;

    -- Result set 2: alergii pacient
    SELECT
        pa.Id,
        pa.AllergyTypeId,
        at.Name          AS AllergyTypeName,
        at.Code          AS AllergyTypeCode,
        pa.AllergySeverityId,
        asev.Name        AS AllergySeverityName,
        asev.Code        AS AllergySeverityCode,
        pa.AllergenName,
        pa.Reaction,
        pa.OnsetDate,
        pa.Notes,
        pa.IsActive,
        pa.CreatedAt
    FROM PatientAllergies pa
    INNER JOIN AllergyTypes      at   ON at.Id   = pa.AllergyTypeId
    INNER JOIN AllergySeverities asev ON asev.Id  = pa.AllergySeverityId
    WHERE pa.PatientId = @Id AND pa.IsActive = 1
    ORDER BY
        CASE asev.Code
            WHEN 'ANAPHYLAXIS' THEN 1
            WHEN 'SEVERE' THEN 2
            WHEN 'MODERATE' THEN 3
            WHEN 'MILD' THEN 4
            ELSE 5
        END, pa.AllergenName;

    -- Result set 3: doctori asignați (+ telefon doctor)
    SELECT
        pd.Id,
        pd.DoctorId,
        d.FirstName + ' ' + d.LastName AS DoctorName,
        d.Email              AS DoctorEmail,
        d.PhoneNumber        AS DoctorPhone,
        d.MedicalCode        AS DoctorMedicalCode,
        sp.Name              AS DoctorSpecialtyName,
        pd.IsPrimary,
        pd.AssignedAt,
        pd.Notes,
        pd.IsActive
    FROM PatientDoctors pd
    INNER JOIN Doctors     d  ON d.Id  = pd.DoctorId   AND d.IsDeleted = 0
    LEFT JOIN  Specialties sp ON sp.Id = d.SpecialtyId  AND sp.IsActive = 1
    WHERE pd.PatientId = @Id AND pd.IsActive = 1
    ORDER BY pd.IsPrimary DESC, d.LastName;

    -- Result set 4: contacte urgență
    SELECT
        ec.Id,
        ec.FullName,
        ec.Relationship,
        ec.PhoneNumber,
        ec.IsDefault,
        ec.Notes,
        ec.IsActive
    FROM PatientEmergencyContacts ec
    WHERE ec.PatientId = @Id AND ec.IsActive = 1
    ORDER BY ec.IsDefault DESC, ec.FullName;
END;
GO
