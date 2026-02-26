-- =====================================================================
-- Migrare 0011: Sistem de permisiuni RBAC
-- Tabele: AccessLevels, Modules, RoleModulePermissions, UserModuleOverrides
-- =====================================================================

-- ===== 1. AccessLevels — niveluri fixe de acces =====
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AccessLevels')
BEGIN
    CREATE TABLE AccessLevels (
        Id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Code     NVARCHAR(10)     NOT NULL,
        Name     NVARCHAR(50)     NOT NULL,
        Level    TINYINT          NOT NULL,  -- 0=none, 1=read, 2=write, 3=full
        CONSTRAINT UQ_AccessLevels_Code  UNIQUE (Code),
        CONSTRAINT UQ_AccessLevels_Level UNIQUE (Level)
    );

    INSERT INTO AccessLevels (Id, Code, Name, Level) VALUES
        ('E1000001-0000-0000-0000-000000000001', 'none',  'Fără acces',    0),
        ('E1000001-0000-0000-0000-000000000002', 'read',  'Vizualizare',   1),
        ('E1000001-0000-0000-0000-000000000003', 'write', 'Editare',       2),
        ('E1000001-0000-0000-0000-000000000004', 'full',  'Control total', 3);
END;
GO

-- ===== 2. Modules — modulele aplicației =====
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Modules')
BEGIN
    CREATE TABLE Modules (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Code        NVARCHAR(50)     NOT NULL,
        Name        NVARCHAR(100)    NOT NULL,
        Description NVARCHAR(500)    NULL,
        SortOrder   INT              NOT NULL DEFAULT 0,
        IsActive    BIT              NOT NULL DEFAULT 1,
        CONSTRAINT UQ_Modules_Code UNIQUE (Code)
    );

    INSERT INTO Modules (Id, Code, Name, Description, SortOrder) VALUES
        ('E2000001-0000-0000-0000-000000000001', 'dashboard',     'Dashboard',          'Pagina principală cu statistici',           1),
        ('E2000001-0000-0000-0000-000000000002', 'patients',      'Pacienți',            'Gestionare pacienți și fișe medicale',      2),
        ('E2000001-0000-0000-0000-000000000003', 'appointments',  'Programări',          'Calendar și programări pacienți',            3),
        ('E2000001-0000-0000-0000-000000000004', 'consultations', 'Consultații',         'Consultații medicale și examen clinic',      4),
        ('E2000001-0000-0000-0000-000000000005', 'prescriptions', 'Rețete',              'Prescripții medicale',                      5),
        ('E2000001-0000-0000-0000-000000000006', 'documents',     'Documente',           'Trimiteri, scrisori medicale, concedii',    6),
        ('E2000001-0000-0000-0000-000000000007', 'invoices',      'Facturi',             'Facturare servicii medicale',               7),
        ('E2000001-0000-0000-0000-000000000008', 'payments',      'Plăți',               'Încasări și plăți',                         8),
        ('E2000001-0000-0000-0000-000000000009', 'reports',       'Rapoarte',            'Rapoarte medicale și statistici',           9),
        ('E2000001-0000-0000-0000-00000000000A', 'nomenclature',  'Nomenclatoare',       'Specialități, titluri, departamente',      10),
        ('E2000001-0000-0000-0000-00000000000B', 'users',         'Utilizatori',         'Gestionare utilizatori și permisiuni',     11),
        ('E2000001-0000-0000-0000-00000000000C', 'clinic',        'Clinică',             'Configurare clinică',                      12),
        ('E2000001-0000-0000-0000-00000000000D', 'cnas',          'CNAS',                'Raportare SIUI / Casa de Asigurări',       13);
END;
GO

-- ===== 3. RoleModulePermissions — permisiuni default per rol =====
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'RoleModulePermissions')
BEGIN
    CREATE TABLE RoleModulePermissions (
        Id             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        RoleId         UNIQUEIDENTIFIER NOT NULL,
        ModuleId       UNIQUEIDENTIFIER NOT NULL,
        AccessLevelId  UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT FK_RoleModPerm_Roles        FOREIGN KEY (RoleId)        REFERENCES Roles(Id),
        CONSTRAINT FK_RoleModPerm_Modules      FOREIGN KEY (ModuleId)      REFERENCES Modules(Id),
        CONSTRAINT FK_RoleModPerm_AccessLevels FOREIGN KEY (AccessLevelId) REFERENCES AccessLevels(Id),
        CONSTRAINT UQ_RoleModPerm_Role_Module  UNIQUE (RoleId, ModuleId)
    );

    -- Variabile pentru lizibilitate
    -- Roluri (din migrarea 0008):
    --   Admin           = D1000001-0000-0000-0000-000000000001
    --   Doctor          = D1000001-0000-0000-0000-000000000002
    --   Nurse           = D1000001-0000-0000-0000-000000000003
    --   Receptionist    = D1000001-0000-0000-0000-000000000004
    --   ClinicManager   = D1000001-0000-0000-0000-000000000005

    -- Access Levels:
    --   none = E1000001-..01, read = E1000001-..02, write = E1000001-..03, full = E1000001-..04

    DECLARE @None  UNIQUEIDENTIFIER = 'E1000001-0000-0000-0000-000000000001';
    DECLARE @Read  UNIQUEIDENTIFIER = 'E1000001-0000-0000-0000-000000000002';
    DECLARE @Write UNIQUEIDENTIFIER = 'E1000001-0000-0000-0000-000000000003';
    DECLARE @Full  UNIQUEIDENTIFIER = 'E1000001-0000-0000-0000-000000000004';

    DECLARE @Admin         UNIQUEIDENTIFIER = 'D1000001-0000-0000-0000-000000000001';
    DECLARE @Doctor        UNIQUEIDENTIFIER = 'D1000001-0000-0000-0000-000000000002';
    DECLARE @Nurse         UNIQUEIDENTIFIER = 'D1000001-0000-0000-0000-000000000003';
    DECLARE @Receptionist  UNIQUEIDENTIFIER = 'D1000001-0000-0000-0000-000000000004';
    DECLARE @ClinicMgr     UNIQUEIDENTIFIER = 'D1000001-0000-0000-0000-000000000005';

    DECLARE @mDashboard     UNIQUEIDENTIFIER = 'E2000001-0000-0000-0000-000000000001';
    DECLARE @mPatients      UNIQUEIDENTIFIER = 'E2000001-0000-0000-0000-000000000002';
    DECLARE @mAppointments  UNIQUEIDENTIFIER = 'E2000001-0000-0000-0000-000000000003';
    DECLARE @mConsultations UNIQUEIDENTIFIER = 'E2000001-0000-0000-0000-000000000004';
    DECLARE @mPrescriptions UNIQUEIDENTIFIER = 'E2000001-0000-0000-0000-000000000005';
    DECLARE @mDocuments     UNIQUEIDENTIFIER = 'E2000001-0000-0000-0000-000000000006';
    DECLARE @mInvoices      UNIQUEIDENTIFIER = 'E2000001-0000-0000-0000-000000000007';
    DECLARE @mPayments      UNIQUEIDENTIFIER = 'E2000001-0000-0000-0000-000000000008';
    DECLARE @mReports       UNIQUEIDENTIFIER = 'E2000001-0000-0000-0000-000000000009';
    DECLARE @mNomenclature  UNIQUEIDENTIFIER = 'E2000001-0000-0000-0000-00000000000A';
    DECLARE @mUsers         UNIQUEIDENTIFIER = 'E2000001-0000-0000-0000-00000000000B';
    DECLARE @mClinic        UNIQUEIDENTIFIER = 'E2000001-0000-0000-0000-00000000000C';
    DECLARE @mCnas          UNIQUEIDENTIFIER = 'E2000001-0000-0000-0000-00000000000D';

    -- ===== ADMIN — Full Control pe tot =====
    INSERT INTO RoleModulePermissions (RoleId, ModuleId, AccessLevelId) VALUES
        (@Admin, @mDashboard,     @Full),
        (@Admin, @mPatients,      @Full),
        (@Admin, @mAppointments,  @Full),
        (@Admin, @mConsultations, @Full),
        (@Admin, @mPrescriptions, @Full),
        (@Admin, @mDocuments,     @Full),
        (@Admin, @mInvoices,      @Full),
        (@Admin, @mPayments,      @Full),
        (@Admin, @mReports,       @Full),
        (@Admin, @mNomenclature,  @Full),
        (@Admin, @mUsers,         @Full),
        (@Admin, @mClinic,        @Full),
        (@Admin, @mCnas,          @Full);

    -- ===== DOCTOR =====
    INSERT INTO RoleModulePermissions (RoleId, ModuleId, AccessLevelId) VALUES
        (@Doctor, @mDashboard,     @Read),
        (@Doctor, @mPatients,      @Write),
        (@Doctor, @mAppointments,  @Write),
        (@Doctor, @mConsultations, @Write),
        (@Doctor, @mPrescriptions, @Write),
        (@Doctor, @mDocuments,     @Write),
        (@Doctor, @mInvoices,      @None),
        (@Doctor, @mPayments,      @None),
        (@Doctor, @mReports,       @Read),
        (@Doctor, @mNomenclature,  @Read),
        (@Doctor, @mUsers,         @None),
        (@Doctor, @mClinic,        @None),
        (@Doctor, @mCnas,          @None);

    -- ===== NURSE (Asistentă) =====
    INSERT INTO RoleModulePermissions (RoleId, ModuleId, AccessLevelId) VALUES
        (@Nurse, @mDashboard,     @Read),
        (@Nurse, @mPatients,      @Read),
        (@Nurse, @mAppointments,  @Read),
        (@Nurse, @mConsultations, @Read),
        (@Nurse, @mPrescriptions, @Read),
        (@Nurse, @mDocuments,     @None),
        (@Nurse, @mInvoices,      @None),
        (@Nurse, @mPayments,      @None),
        (@Nurse, @mReports,       @None),
        (@Nurse, @mNomenclature,  @Read),
        (@Nurse, @mUsers,         @None),
        (@Nurse, @mClinic,        @None),
        (@Nurse, @mCnas,          @None);

    -- ===== RECEPTIONIST =====
    INSERT INTO RoleModulePermissions (RoleId, ModuleId, AccessLevelId) VALUES
        (@Receptionist, @mDashboard,     @Read),
        (@Receptionist, @mPatients,      @Write),
        (@Receptionist, @mAppointments,  @Full),
        (@Receptionist, @mConsultations, @None),
        (@Receptionist, @mPrescriptions, @None),
        (@Receptionist, @mDocuments,     @Write),
        (@Receptionist, @mInvoices,      @Write),
        (@Receptionist, @mPayments,      @Write),
        (@Receptionist, @mReports,       @None),
        (@Receptionist, @mNomenclature,  @Read),
        (@Receptionist, @mUsers,         @None),
        (@Receptionist, @mClinic,        @None),
        (@Receptionist, @mCnas,          @None);

    -- ===== CLINIC MANAGER =====
    INSERT INTO RoleModulePermissions (RoleId, ModuleId, AccessLevelId) VALUES
        (@ClinicMgr, @mDashboard,     @Read),
        (@ClinicMgr, @mPatients,      @Read),
        (@ClinicMgr, @mAppointments,  @Read),
        (@ClinicMgr, @mConsultations, @None),
        (@ClinicMgr, @mPrescriptions, @None),
        (@ClinicMgr, @mDocuments,     @None),
        (@ClinicMgr, @mInvoices,      @Read),
        (@ClinicMgr, @mPayments,      @Read),
        (@ClinicMgr, @mReports,       @Full),
        (@ClinicMgr, @mNomenclature,  @Read),
        (@ClinicMgr, @mUsers,         @Read),
        (@ClinicMgr, @mClinic,        @Write),
        (@ClinicMgr, @mCnas,          @Full);
END;
GO

-- ===== 4. UserModuleOverrides — override per utilizator =====
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'UserModuleOverrides')
BEGIN
    CREATE TABLE UserModuleOverrides (
        Id             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        UserId         UNIQUEIDENTIFIER NOT NULL,
        ModuleId       UNIQUEIDENTIFIER NOT NULL,
        AccessLevelId  UNIQUEIDENTIFIER NOT NULL,
        Reason         NVARCHAR(500)    NULL,        -- motivul override-ului (audit)
        GrantedBy      UNIQUEIDENTIFIER NOT NULL,    -- cine a acordat override-ul
        GrantedAt      DATETIME2        NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_UserModOvr_Users        FOREIGN KEY (UserId)        REFERENCES Users(Id),
        CONSTRAINT FK_UserModOvr_Modules      FOREIGN KEY (ModuleId)      REFERENCES Modules(Id),
        CONSTRAINT FK_UserModOvr_AccessLevels FOREIGN KEY (AccessLevelId) REFERENCES AccessLevels(Id),
        CONSTRAINT FK_UserModOvr_GrantedBy    FOREIGN KEY (GrantedBy)     REFERENCES Users(Id),
        CONSTRAINT UQ_UserModOvr_User_Module  UNIQUE (UserId, ModuleId)
    );

    CREATE INDEX IX_UserModOvr_UserId ON UserModuleOverrides (UserId);
END;
GO
