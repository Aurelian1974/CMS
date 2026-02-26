-- =============================================================================
-- Migrare 0014: Creare tabele Patients, PatientAllergies, PatientDoctors,
--               PatientEmergencyContacts + indecși
-- =============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ==================== TABEL PATIENTS ====================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Patients')
BEGIN
    CREATE TABLE Patients (
        Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        ClinicId        UNIQUEIDENTIFIER NOT NULL,
        FirstName       NVARCHAR(100)    NOT NULL,
        LastName        NVARCHAR(100)    NOT NULL,
        Cnp             NCHAR(13)        NULL,
        BirthDate       DATE             NULL,
        GenderId        UNIQUEIDENTIFIER NULL,
        BloodTypeId     UNIQUEIDENTIFIER NULL,
        PhoneNumber     NVARCHAR(20)     NULL,
        Email           NVARCHAR(200)    NULL,
        Address         NVARCHAR(500)    NULL,
        -- Asigurare medicală
        InsuranceNumber NVARCHAR(50)     NULL,       -- număr asigurare CNAS
        InsuranceExpiry DATE             NULL,       -- dată expirare asigurare
        -- Note și observații
        Notes           NVARCHAR(MAX)    NULL,       -- note generale ale pacientului
        -- Audit & soft delete
        IsActive        BIT              NOT NULL DEFAULT 1,
        IsDeleted       BIT              NOT NULL DEFAULT 0,
        RowVersion      ROWVERSION       NOT NULL,
        CreatedAt       DATETIME2        NOT NULL DEFAULT GETDATE(),
        CreatedBy       UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt       DATETIME2        NULL,
        UpdatedBy       UNIQUEIDENTIFIER NULL,

        -- FK-uri
        CONSTRAINT FK_Patients_Clinics    FOREIGN KEY (ClinicId)    REFERENCES Clinics(Id),
        CONSTRAINT FK_Patients_Genders    FOREIGN KEY (GenderId)    REFERENCES Genders(Id),
        CONSTRAINT FK_Patients_BloodTypes FOREIGN KEY (BloodTypeId) REFERENCES BloodTypes(Id),

        -- CNP unic per clinică (doar neșterse, doar dacă CNP e NOT NULL)
        CONSTRAINT UQ_Patients_Cnp_Clinic UNIQUE (Cnp, ClinicId)
    );

    PRINT 'Tabelul Patients a fost creat.';
END;
GO

-- ==================== INDECȘI PATIENTS ====================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Patients_ClinicId' AND object_id = OBJECT_ID('Patients'))
    CREATE NONCLUSTERED INDEX IX_Patients_ClinicId ON Patients(ClinicId) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Patients_Cnp' AND object_id = OBJECT_ID('Patients'))
    CREATE NONCLUSTERED INDEX IX_Patients_Cnp ON Patients(Cnp) WHERE IsDeleted = 0 AND Cnp IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Patients_GenderId' AND object_id = OBJECT_ID('Patients'))
    CREATE NONCLUSTERED INDEX IX_Patients_GenderId ON Patients(GenderId) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Patients_LastName' AND object_id = OBJECT_ID('Patients'))
    CREATE NONCLUSTERED INDEX IX_Patients_LastName ON Patients(LastName) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Patients_IsActive' AND object_id = OBJECT_ID('Patients'))
    CREATE NONCLUSTERED INDEX IX_Patients_IsActive ON Patients(IsActive) WHERE IsDeleted = 0;
GO

-- ==================== TABEL PATIENT ALLERGIES ====================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PatientAllergies')
BEGIN
    CREATE TABLE PatientAllergies (
        Id                UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        PatientId         UNIQUEIDENTIFIER NOT NULL,
        AllergyTypeId     UNIQUEIDENTIFIER NOT NULL,
        AllergySeverityId UNIQUEIDENTIFIER NOT NULL,
        AllergenName      NVARCHAR(200)    NOT NULL,   -- substanța (ex: Penicilină, Gluten, Polen)
        Reaction          NVARCHAR(500)    NULL,        -- reacția observată
        OnsetDate         DATE             NULL,        -- data primei manifestări
        Notes             NVARCHAR(500)    NULL,
        IsActive          BIT              NOT NULL DEFAULT 1,
        CreatedAt         DATETIME2        NOT NULL DEFAULT GETDATE(),
        CreatedBy         UNIQUEIDENTIFIER NOT NULL,

        CONSTRAINT FK_PatientAllergies_Patients          FOREIGN KEY (PatientId)         REFERENCES Patients(Id),
        CONSTRAINT FK_PatientAllergies_AllergyTypes      FOREIGN KEY (AllergyTypeId)     REFERENCES AllergyTypes(Id),
        CONSTRAINT FK_PatientAllergies_AllergySeverities  FOREIGN KEY (AllergySeverityId) REFERENCES AllergySeverities(Id)
    );

    PRINT 'Tabelul PatientAllergies a fost creat.';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PatientAllergies_PatientId' AND object_id = OBJECT_ID('PatientAllergies'))
    CREATE NONCLUSTERED INDEX IX_PatientAllergies_PatientId ON PatientAllergies(PatientId) WHERE IsActive = 1;
GO

-- ==================== TABEL PATIENT DOCTORS (many-to-many) ====================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PatientDoctors')
BEGIN
    CREATE TABLE PatientDoctors (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        PatientId   UNIQUEIDENTIFIER NOT NULL,
        DoctorId    UNIQUEIDENTIFIER NOT NULL,
        IsPrimary   BIT              NOT NULL DEFAULT 0,   -- doctorul principal al pacientului
        AssignedAt  DATETIME2        NOT NULL DEFAULT GETDATE(),
        Notes       NVARCHAR(500)    NULL,
        IsActive    BIT              NOT NULL DEFAULT 1,
        CreatedBy   UNIQUEIDENTIFIER NOT NULL,

        CONSTRAINT FK_PatientDoctors_Patients FOREIGN KEY (PatientId) REFERENCES Patients(Id),
        CONSTRAINT FK_PatientDoctors_Doctors  FOREIGN KEY (DoctorId)  REFERENCES Doctors(Id),
        CONSTRAINT UQ_PatientDoctors_Patient_Doctor UNIQUE (PatientId, DoctorId)
    );

    PRINT 'Tabelul PatientDoctors a fost creat.';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PatientDoctors_PatientId' AND object_id = OBJECT_ID('PatientDoctors'))
    CREATE NONCLUSTERED INDEX IX_PatientDoctors_PatientId ON PatientDoctors(PatientId) WHERE IsActive = 1;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PatientDoctors_DoctorId' AND object_id = OBJECT_ID('PatientDoctors'))
    CREATE NONCLUSTERED INDEX IX_PatientDoctors_DoctorId ON PatientDoctors(DoctorId) WHERE IsActive = 1;
GO

-- ==================== TABEL PATIENT EMERGENCY CONTACTS ====================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PatientEmergencyContacts')
BEGIN
    CREATE TABLE PatientEmergencyContacts (
        Id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        PatientId    UNIQUEIDENTIFIER NOT NULL,
        FullName     NVARCHAR(200)    NOT NULL,
        Relationship NVARCHAR(100)    NOT NULL,   -- Soț/Soție, Părinte, Fiu/Fiică, Frate/Soră, Altele
        PhoneNumber  NVARCHAR(20)     NOT NULL,
        IsDefault    BIT              NOT NULL DEFAULT 0,   -- contactul implicit de urgență
        Notes        NVARCHAR(500)    NULL,
        IsActive     BIT              NOT NULL DEFAULT 1,
        CreatedAt    DATETIME2        NOT NULL DEFAULT GETDATE(),
        CreatedBy    UNIQUEIDENTIFIER NOT NULL,

        CONSTRAINT FK_PatientEmergencyContacts_Patients FOREIGN KEY (PatientId) REFERENCES Patients(Id)
    );

    PRINT 'Tabelul PatientEmergencyContacts a fost creat.';
END;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PatientEmergencyContacts_PatientId' AND object_id = OBJECT_ID('PatientEmergencyContacts'))
    CREATE NONCLUSTERED INDEX IX_PatientEmergencyContacts_PatientId ON PatientEmergencyContacts(PatientId) WHERE IsActive = 1;
GO

PRINT 'Migrarea 0014_CreatePatients.sql finalizată cu succes.';
GO
