-- =============================================================================
-- Migrare 0060: Personal administrativ (recepționeri, manageri, administratori)
--   1. Nomenclator AdministrativePositions (funcții administrative)
--   2. Tabel AdministrativeStaff
--   3. Users.AdministrativeStaffId + CHECK: contul se leagă de exact o persoană
--      (doctor, personal medical sau personal administrativ)
-- =============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ==================== NOMENCLATOR FUNCȚII ADMINISTRATIVE ====================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AdministrativePositions')
BEGIN
    CREATE TABLE dbo.AdministrativePositions (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Name        NVARCHAR(100)    NOT NULL,
        Code        NVARCHAR(50)     NOT NULL,
        SortOrder   INT              NOT NULL DEFAULT 0,
        IsActive    BIT              NOT NULL DEFAULT 1,

        CONSTRAINT UQ_AdministrativePositions_Code UNIQUE (Code)
    );

    PRINT 'Tabelul AdministrativePositions a fost creat.';
END;
GO

MERGE dbo.AdministrativePositions AS target
USING (VALUES
    ('AD000001-0000-0000-0000-000000000001', N'Recepționer',     'RECEPTIONER',     1),
    ('AD000001-0000-0000-0000-000000000002', N'Registrator',     'REGISTRATOR',     2),
    ('AD000001-0000-0000-0000-000000000003', N'Manager clinică', 'MANAGER_CLINICA', 3),
    ('AD000001-0000-0000-0000-000000000004', N'Administrator',   'ADMINISTRATOR',   4),
    ('AD000001-0000-0000-0000-000000000005', N'Contabil',        'CONTABIL',        5)
) AS source (Id, Name, Code, SortOrder)
ON target.Code = source.Code
WHEN NOT MATCHED THEN
    INSERT (Id, Name, Code, SortOrder, IsActive)
    VALUES (source.Id, source.Name, source.Code, source.SortOrder, 1);
GO

-- ==================== TABEL ADMINISTRATIVESTAFF ====================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AdministrativeStaff')
BEGIN
    CREATE TABLE dbo.AdministrativeStaff (
        Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        ClinicId        UNIQUEIDENTIFIER NOT NULL,
        DepartmentId    UNIQUEIDENTIFIER NULL,
        PositionId      UNIQUEIDENTIFIER NULL,
        FirstName       NVARCHAR(100)    NOT NULL,
        LastName        NVARCHAR(100)    NOT NULL,
        Email           NVARCHAR(200)    NOT NULL,
        PhoneNumber     NVARCHAR(20)     NULL,
        IsActive        BIT              NOT NULL DEFAULT 1,
        IsDeleted       BIT              NOT NULL DEFAULT 0,
        RowVersion      ROWVERSION       NOT NULL,
        CreatedAt       DATETIME2        NOT NULL DEFAULT GETDATE(),
        CreatedBy       UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt       DATETIME2        NULL,
        UpdatedBy       UNIQUEIDENTIFIER NULL,

        CONSTRAINT FK_AdministrativeStaff_Clinics     FOREIGN KEY (ClinicId)     REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_AdministrativeStaff_Departments FOREIGN KEY (DepartmentId) REFERENCES dbo.Departments(Id),
        CONSTRAINT FK_AdministrativeStaff_Positions   FOREIGN KEY (PositionId)   REFERENCES dbo.AdministrativePositions(Id)
    );

    PRINT 'Tabelul AdministrativeStaff a fost creat.';
END;
GO

-- Email unic per clinică doar pe rândurile neșterse: un angajat șters nu blochează reangajarea
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_AdministrativeStaff_Email_Clinic' AND object_id = OBJECT_ID('dbo.AdministrativeStaff'))
    CREATE UNIQUE NONCLUSTERED INDEX UX_AdministrativeStaff_Email_Clinic
        ON dbo.AdministrativeStaff (ClinicId, Email) WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AdministrativeStaff_ClinicId' AND object_id = OBJECT_ID('dbo.AdministrativeStaff'))
    CREATE NONCLUSTERED INDEX IX_AdministrativeStaff_ClinicId
        ON dbo.AdministrativeStaff (ClinicId, LastName, FirstName)
        INCLUDE (DepartmentId, PositionId, IsActive)
        WHERE IsDeleted = 0;
GO

-- ==================== USERS — ASOCIERE PERSONAL ADMINISTRATIV ====================

IF COL_LENGTH('dbo.Users', 'AdministrativeStaffId') IS NULL
    ALTER TABLE dbo.Users ADD AdministrativeStaffId UNIQUEIDENTIFIER NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_Users_AdministrativeStaff')
    ALTER TABLE dbo.Users
        ADD CONSTRAINT FK_Users_AdministrativeStaff
        FOREIGN KEY (AdministrativeStaffId) REFERENCES dbo.AdministrativeStaff(Id);
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Users_DoctorOrStaff')
    ALTER TABLE dbo.Users DROP CONSTRAINT CK_Users_DoctorOrStaff;
GO

IF NOT EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Users_SingleAssociation')
    ALTER TABLE dbo.Users
        ADD CONSTRAINT CK_Users_SingleAssociation CHECK (
              (CASE WHEN DoctorId              IS NOT NULL THEN 1 ELSE 0 END)
            + (CASE WHEN MedicalStaffId        IS NOT NULL THEN 1 ELSE 0 END)
            + (CASE WHEN AdministrativeStaffId IS NOT NULL THEN 1 ELSE 0 END) = 1
        );
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Users_AdministrativeStaffId' AND object_id = OBJECT_ID('dbo.Users'))
    CREATE NONCLUSTERED INDEX IX_Users_AdministrativeStaffId
        ON dbo.Users (AdministrativeStaffId)
        WHERE IsDeleted = 0 AND AdministrativeStaffId IS NOT NULL;
GO

PRINT 'Migrarea 0060_CreateAdministrativeStaff finalizată cu succes.';
GO
