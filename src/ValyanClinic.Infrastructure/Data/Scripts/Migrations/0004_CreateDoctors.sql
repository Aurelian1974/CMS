-- =============================================================================
-- Migrare 0004: Creare tabel Doctors + seed administrator de sistem și manager
-- =============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ==================== TABEL DOCTORS ====================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Doctors')
BEGIN
    CREATE TABLE Doctors (
        Id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        ClinicId            UNIQUEIDENTIFIER NOT NULL,
        DepartmentId        UNIQUEIDENTIFIER NULL,
        SupervisorDoctorId  UNIQUEIDENTIFIER NULL,
        SpecialtyId         UNIQUEIDENTIFIER NULL,
        SubspecialtyId      UNIQUEIDENTIFIER NULL,
        FirstName           NVARCHAR(100)    NOT NULL,
        LastName            NVARCHAR(100)    NOT NULL,
        Email               NVARCHAR(200)    NOT NULL,
        PhoneNumber         NVARCHAR(20)     NULL,
        MedicalCode         NVARCHAR(20)     NULL,       -- parafa medicală
        LicenseNumber       NVARCHAR(50)     NULL,       -- număr CMR
        LicenseExpiresAt    DATE             NULL,       -- dată expirare aviz CMR
        IsActive            BIT              NOT NULL DEFAULT 1,
        IsDeleted           BIT              NOT NULL DEFAULT 0,
        RowVersion          ROWVERSION       NOT NULL,
        CreatedAt           DATETIME2        NOT NULL DEFAULT GETDATE(),
        CreatedBy           UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt           DATETIME2        NULL,
        UpdatedBy           UNIQUEIDENTIFIER NULL,

        -- FK-uri
        CONSTRAINT FK_Doctors_Clinics        FOREIGN KEY (ClinicId)           REFERENCES Clinics(Id),
        CONSTRAINT FK_Doctors_Departments    FOREIGN KEY (DepartmentId)       REFERENCES Departments(Id),
        CONSTRAINT FK_Doctors_Supervisors    FOREIGN KEY (SupervisorDoctorId) REFERENCES Doctors(Id),
        CONSTRAINT FK_Doctors_Specialties    FOREIGN KEY (SpecialtyId)        REFERENCES Specialties(Id),
        CONSTRAINT FK_Doctors_Subspecialties FOREIGN KEY (SubspecialtyId)     REFERENCES Specialties(Id),

        -- Email unic per clinică (doar neșterse)
        CONSTRAINT UQ_Doctors_Email_Clinic UNIQUE (Email, ClinicId)
    );

    PRINT 'Tabelul Doctors a fost creat.';
END;
GO

-- ==================== INDECȘI ====================

SET QUOTED_IDENTIFIER ON;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Doctors_ClinicId' AND object_id = OBJECT_ID('Doctors'))
    CREATE NONCLUSTERED INDEX IX_Doctors_ClinicId ON Doctors(ClinicId) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Doctors_DepartmentId' AND object_id = OBJECT_ID('Doctors'))
    CREATE NONCLUSTERED INDEX IX_Doctors_DepartmentId ON Doctors(DepartmentId) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Doctors_SpecialtyId' AND object_id = OBJECT_ID('Doctors'))
    CREATE NONCLUSTERED INDEX IX_Doctors_SpecialtyId ON Doctors(SpecialtyId) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Doctors_SupervisorDoctorId' AND object_id = OBJECT_ID('Doctors'))
    CREATE NONCLUSTERED INDEX IX_Doctors_SupervisorDoctorId ON Doctors(SupervisorDoctorId) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Doctors_IsActive' AND object_id = OBJECT_ID('Doctors'))
    CREATE NONCLUSTERED INDEX IX_Doctors_IsActive ON Doctors(IsActive) WHERE IsDeleted = 0;
GO

-- ==================== FK HeadDoctorId pe Departments ====================
-- HeadDoctorId a fost creat ca NULL în 0003_CreateDepartments.sql, fără FK.
-- Acum adăugăm FK-ul către Doctors.

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys
    WHERE name = 'FK_Departments_HeadDoctor' AND parent_object_id = OBJECT_ID('Departments')
)
BEGIN
    ALTER TABLE Departments
        ADD CONSTRAINT FK_Departments_HeadDoctor
        FOREIGN KEY (HeadDoctorId) REFERENCES Doctors(Id);

    PRINT 'FK Departments.HeadDoctorId → Doctors.Id adăugat.';
END;
GO

-- ==================== SEED: 2 înregistrări generice ====================

-- Clinica default seeded anterior: A0000001-0000-0000-0000-000000000001
-- Userul default: B0000001-0000-0000-0000-000000000001
DECLARE @ClinicId  UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000001';
DECLARE @CreatedBy UNIQUEIDENTIFIER = 'B0000001-0000-0000-0000-000000000001';

-- 1. Administrator de sistem (drepturi full, fără departament/specialitate)
IF NOT EXISTS (SELECT 1 FROM Doctors WHERE Id = 'D0000001-0000-0000-0000-000000000001')
BEGIN
    INSERT INTO Doctors (Id, ClinicId, DepartmentId, SupervisorDoctorId, SpecialtyId, SubspecialtyId,
                         FirstName, LastName, Email, PhoneNumber, MedicalCode, LicenseNumber,
                         LicenseExpiresAt, IsActive, IsDeleted, CreatedAt, CreatedBy)
    VALUES (
        'D0000001-0000-0000-0000-000000000001',
        @ClinicId,
        NULL,           -- fără departament
        NULL,           -- fără supervisor (el e root)
        NULL,           -- fără specialitate
        NULL,           -- fără subspecialitate
        N'Administrator',
        N'Sistem',
        N'admin@valyanclinic.ro',
        NULL,
        N'SYS-ADMIN',
        NULL,
        NULL,
        1,              -- activ
        0,              -- neșters
        GETDATE(),
        @CreatedBy
    );
    PRINT 'Seed: Administrator Sistem creat (D0000001-...).';
END;

-- 2. Manager clinică (supervisor = administratorul de sistem)
IF NOT EXISTS (SELECT 1 FROM Doctors WHERE Id = 'D0000002-0000-0000-0000-000000000001')
BEGIN
    INSERT INTO Doctors (Id, ClinicId, DepartmentId, SupervisorDoctorId, SpecialtyId, SubspecialtyId,
                         FirstName, LastName, Email, PhoneNumber, MedicalCode, LicenseNumber,
                         LicenseExpiresAt, IsActive, IsDeleted, CreatedAt, CreatedBy)
    VALUES (
        'D0000002-0000-0000-0000-000000000001',
        @ClinicId,
        NULL,                                               -- fără departament
        'D0000001-0000-0000-0000-000000000001',             -- supervisor = Admin Sistem
        NULL,                                               -- fără specialitate
        NULL,                                               -- fără subspecialitate
        N'Manager',
        N'Clinică',
        N'manager@valyanclinic.ro',
        NULL,
        N'CLINIC-MGR',
        NULL,
        NULL,
        1,
        0,
        GETDATE(),
        @CreatedBy
    );
    PRINT 'Seed: Manager Clinică creat (D0000002-...).';
END;
GO

PRINT 'Migrarea 0004_CreateDoctors.sql finalizată cu succes.';
GO
