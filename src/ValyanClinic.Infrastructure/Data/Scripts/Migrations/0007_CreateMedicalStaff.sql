-- =============================================================================
-- Migrare 0007: Creare tabel MedicalStaff — personal medical non-doctor
-- (asistenți, infirmieri, moașe, kinetoterapeuți, farmaciști etc.)
-- =============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ==================== TABEL MEDICALSTAFF ====================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MedicalStaff')
BEGIN
    CREATE TABLE MedicalStaff (
        Id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        ClinicId            UNIQUEIDENTIFIER NOT NULL,
        DepartmentId        UNIQUEIDENTIFIER NULL,
        SupervisorDoctorId  UNIQUEIDENTIFIER NULL,           -- FK → Doctors (supervizorul e mereu un doctor)
        MedicalTitleId      UNIQUEIDENTIFIER NULL,           -- FK → MedicalTitles (filtrare client: non-MEDIC)
        FirstName           NVARCHAR(100)    NOT NULL,
        LastName            NVARCHAR(100)    NOT NULL,
        Email               NVARCHAR(200)    NOT NULL,
        PhoneNumber         NVARCHAR(20)     NULL,
        IsActive            BIT              NOT NULL DEFAULT 1,
        IsDeleted           BIT              NOT NULL DEFAULT 0,
        RowVersion          ROWVERSION       NOT NULL,
        CreatedAt           DATETIME2        NOT NULL DEFAULT GETDATE(),
        CreatedBy           UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt           DATETIME2        NULL,
        UpdatedBy           UNIQUEIDENTIFIER NULL,

        -- FK-uri
        CONSTRAINT FK_MedicalStaff_Clinics       FOREIGN KEY (ClinicId)           REFERENCES Clinics(Id),
        CONSTRAINT FK_MedicalStaff_Departments   FOREIGN KEY (DepartmentId)       REFERENCES Departments(Id),
        CONSTRAINT FK_MedicalStaff_Supervisors   FOREIGN KEY (SupervisorDoctorId) REFERENCES Doctors(Id),
        CONSTRAINT FK_MedicalStaff_MedicalTitles FOREIGN KEY (MedicalTitleId)     REFERENCES MedicalTitles(Id),

        -- Email unic per clinică (doar neșterse)
        CONSTRAINT UQ_MedicalStaff_Email_Clinic UNIQUE (Email, ClinicId)
    );

    PRINT 'Tabelul MedicalStaff a fost creat.';
END;
GO

-- ==================== INDECȘI ====================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MedicalStaff_ClinicId' AND object_id = OBJECT_ID('MedicalStaff'))
    CREATE NONCLUSTERED INDEX IX_MedicalStaff_ClinicId ON MedicalStaff(ClinicId) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MedicalStaff_DepartmentId' AND object_id = OBJECT_ID('MedicalStaff'))
    CREATE NONCLUSTERED INDEX IX_MedicalStaff_DepartmentId ON MedicalStaff(DepartmentId) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MedicalStaff_SupervisorDoctorId' AND object_id = OBJECT_ID('MedicalStaff'))
    CREATE NONCLUSTERED INDEX IX_MedicalStaff_SupervisorDoctorId ON MedicalStaff(SupervisorDoctorId) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MedicalStaff_MedicalTitleId' AND object_id = OBJECT_ID('MedicalStaff'))
    CREATE NONCLUSTERED INDEX IX_MedicalStaff_MedicalTitleId ON MedicalStaff(MedicalTitleId) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MedicalStaff_IsActive' AND object_id = OBJECT_ID('MedicalStaff'))
    CREATE NONCLUSTERED INDEX IX_MedicalStaff_IsActive ON MedicalStaff(IsActive) WHERE IsDeleted = 0;
GO

PRINT 'Migrarea 0007_CreateMedicalStaff finalizată cu succes.';
GO
