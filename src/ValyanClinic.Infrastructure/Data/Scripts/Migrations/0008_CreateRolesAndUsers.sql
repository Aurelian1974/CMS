-- =============================================================================
-- Migrare 0008: Creare tabele Roles și Users
-- Un utilizator este ÎNTOTDEAUNA asociat fie unui Doctor, fie unui MedicalStaff.
-- Parolele se stochează hash-uite (BCrypt).
-- =============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ==================== TABEL ROLES (nomenclator) ====================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Roles')
BEGIN
    CREATE TABLE Roles (
        Id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Name     NVARCHAR(50)     NOT NULL,
        Code     NVARCHAR(20)     NOT NULL,
        IsActive BIT              NOT NULL DEFAULT 1,
        CONSTRAINT UQ_Roles_Code UNIQUE (Code)
    );

    PRINT 'Tabelul Roles a fost creat.';
END;
GO

-- ==================== SEED ROLES ====================

IF NOT EXISTS (SELECT 1 FROM Roles WHERE Code = 'admin')
BEGIN
    INSERT INTO Roles (Id, Name, Code, IsActive) VALUES
        ('D1000001-0000-0000-0000-000000000001', N'Administrator',      'admin',          1),
        ('D1000001-0000-0000-0000-000000000002', N'Doctor',             'doctor',         1),
        ('D1000001-0000-0000-0000-000000000003', N'Asistentă',         'nurse',          1),
        ('D1000001-0000-0000-0000-000000000004', N'Recepționer',       'receptionist',   1),
        ('D1000001-0000-0000-0000-000000000005', N'Manager Clinică',   'clinic_manager', 1);

    PRINT 'Datele de seed pentru Roles au fost inserate.';
END;
GO

-- ==================== TABEL USERS ====================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Users')
BEGIN
    CREATE TABLE Users (
        Id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        ClinicId            UNIQUEIDENTIFIER NOT NULL,
        RoleId              UNIQUEIDENTIFIER NOT NULL,
        DoctorId            UNIQUEIDENTIFIER NULL,           -- FK → Doctors (NULL dacă e personal medical)
        MedicalStaffId      UNIQUEIDENTIFIER NULL,           -- FK → MedicalStaff (NULL dacă e doctor)
        Email               NVARCHAR(200)    NOT NULL,
        PasswordHash        NVARCHAR(500)    NOT NULL,
        FirstName           NVARCHAR(100)    NOT NULL,
        LastName            NVARCHAR(100)    NOT NULL,
        IsActive            BIT              NOT NULL DEFAULT 1,
        IsDeleted           BIT              NOT NULL DEFAULT 0,
        LastLoginAt         DATETIME2        NULL,
        FailedLoginAttempts INT              NOT NULL DEFAULT 0,
        LockoutEnd          DATETIME2        NULL,
        RowVersion          ROWVERSION       NOT NULL,
        CreatedAt           DATETIME2        NOT NULL DEFAULT GETDATE(),
        CreatedBy           UNIQUEIDENTIFIER NULL,
        UpdatedAt           DATETIME2        NULL,
        UpdatedBy           UNIQUEIDENTIFIER NULL,

        -- FK-uri
        CONSTRAINT FK_Users_Clinics       FOREIGN KEY (ClinicId)       REFERENCES Clinics(Id),
        CONSTRAINT FK_Users_Roles         FOREIGN KEY (RoleId)         REFERENCES Roles(Id),
        CONSTRAINT FK_Users_Doctors       FOREIGN KEY (DoctorId)       REFERENCES Doctors(Id),
        CONSTRAINT FK_Users_MedicalStaff  FOREIGN KEY (MedicalStaffId) REFERENCES MedicalStaff(Id),

        -- Email unic per clinică (doar neșterse)
        CONSTRAINT UQ_Users_Email_Clinic UNIQUE (Email, ClinicId),

        -- Un utilizator trebuie asociat fie unui Doctor, fie unui MedicalStaff (exact unul)
        CONSTRAINT CK_Users_DoctorOrStaff CHECK (
            (DoctorId IS NOT NULL AND MedicalStaffId IS NULL)
            OR
            (DoctorId IS NULL AND MedicalStaffId IS NOT NULL)
        )
    );

    PRINT 'Tabelul Users a fost creat.';
END;
GO

-- ==================== INDECȘI ====================

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_ClinicId' AND object_id = OBJECT_ID('Users'))
    CREATE NONCLUSTERED INDEX IX_Users_ClinicId ON Users(ClinicId) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_RoleId' AND object_id = OBJECT_ID('Users'))
    CREATE NONCLUSTERED INDEX IX_Users_RoleId ON Users(RoleId) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_DoctorId' AND object_id = OBJECT_ID('Users'))
    CREATE NONCLUSTERED INDEX IX_Users_DoctorId ON Users(DoctorId) WHERE IsDeleted = 0 AND DoctorId IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_MedicalStaffId' AND object_id = OBJECT_ID('Users'))
    CREATE NONCLUSTERED INDEX IX_Users_MedicalStaffId ON Users(MedicalStaffId) WHERE IsDeleted = 0 AND MedicalStaffId IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_Email' AND object_id = OBJECT_ID('Users'))
    CREATE NONCLUSTERED INDEX IX_Users_Email ON Users(Email) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_IsActive' AND object_id = OBJECT_ID('Users'))
    CREATE NONCLUSTERED INDEX IX_Users_IsActive ON Users(IsActive) WHERE IsDeleted = 0;
GO

PRINT N'Migrarea 0008_CreateRolesAndUsers finalizată cu succes.';
GO
