-- ============================================================================
-- Migrare: 0003_CreateDepartments.sql
-- Descriere: Creare tabel Departments (departamente / secții ale clinicii).
--            Un departament aparține unei locații fizice (ClinicLocations)
--            și poate avea un șef ierarhic (HeadDoctorId — FK adăugat la modulul Doctors).
-- Data: 2026-02-24
-- ============================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ==================== TABEL DEPARTMENTS ====================
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Departments')
BEGIN
    CREATE TABLE Departments (
        Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        ClinicId        UNIQUEIDENTIFIER NOT NULL,
        LocationId      UNIQUEIDENTIFIER NOT NULL,                -- Locația fizică a departamentului
        Name            NVARCHAR(200)    NOT NULL,                 -- Denumire departament (ex: 'Cardiologie')
        Code            NVARCHAR(20)     NOT NULL,                 -- Cod scurt unic per clinică (ex: 'CARDIO')
        Description     NVARCHAR(500)    NULL,                     -- Descriere opțională
        HeadDoctorId    UNIQUEIDENTIFIER NULL,                     -- Șeful departamentului (FK→Doctors, adaugat ulterior)
        IsActive        BIT              NOT NULL DEFAULT 1,
        IsDeleted       BIT              NOT NULL DEFAULT 0,
        CreatedAt       DATETIME2        NOT NULL DEFAULT GETDATE(),
        UpdatedAt       DATETIME2        NULL,

        CONSTRAINT FK_Departments_Clinics         FOREIGN KEY (ClinicId)   REFERENCES Clinics(Id),
        CONSTRAINT FK_Departments_ClinicLocations FOREIGN KEY (LocationId) REFERENCES ClinicLocations(Id),
        CONSTRAINT UQ_Departments_Code_Clinic     UNIQUE (Code, ClinicId)
    );
END;
GO

-- ==================== INDEXURI ====================
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Departments_ClinicId' AND object_id = OBJECT_ID('Departments'))
    CREATE INDEX IX_Departments_ClinicId ON Departments(ClinicId) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Departments_LocationId' AND object_id = OBJECT_ID('Departments'))
    CREATE INDEX IX_Departments_LocationId ON Departments(LocationId) WHERE IsDeleted = 0;
GO
