-- ============================================================================
-- Seed E2E — conturi de test per rol pentru dashboard-roles.spec.ts
-- NU face parte din DbUp: se rulează manual, doar pe baze de dev/test
-- (vezi seed-role-users.ps1). Idempotent.
--
-- Parola conturilor = parola contului `admin` (se copiază hash-ul), deci testele
-- folosesc aceleași credențiale ca CREDENTIALS.admin.
-- ============================================================================
SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @AdminId  UNIQUEIDENTIFIER, @ClinicId UNIQUEIDENTIFIER, @Hash NVARCHAR(500);
SELECT @AdminId = Id, @ClinicId = ClinicId, @Hash = PasswordHash
FROM dbo.Users WHERE Username = N'admin' AND IsDeleted = 0;

IF @AdminId IS NULL
    THROW 50000, N'Contul admin lipsește — seed-ul E2E nu poate continua.', 1;

DECLARE @RoleDoctor       UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Code = N'doctor');
DECLARE @RoleNurse        UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Code = N'nurse');
DECLARE @RoleReceptionist UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Code = N'receptionist');
DECLARE @RoleManager      UNIQUEIDENTIFIER = (SELECT Id FROM dbo.Roles WHERE Code = N'clinic_manager');
DECLARE @LevelNone        UNIQUEIDENTIFIER = (SELECT Id FROM dbo.AccessLevels WHERE Code = N'none');

-- Medicul: primul medic activ cu specialitate (conturile tehnice n-au specialitate)
DECLARE @DoctorId UNIQUEIDENTIFIER = (
    SELECT TOP (1) d.Id FROM dbo.Doctors d
    WHERE d.ClinicId = @ClinicId AND d.IsDeleted = 0 AND d.IsActive = 1 AND d.SpecialtyId IS NOT NULL
    ORDER BY d.CreatedAt);

-- Personal medical pentru conturile fără medic (CK_Users_DoctorOrStaff)
DECLARE @StaffReception UNIQUEIDENTIFIER = 'E2E00000-0000-0000-0000-00000000A001';
DECLARE @StaffManager   UNIQUEIDENTIFIER = 'E2E00000-0000-0000-0000-00000000A002';
DECLARE @StaffNurse     UNIQUEIDENTIFIER = 'E2E00000-0000-0000-0000-00000000A003';

BEGIN TRANSACTION;

IF NOT EXISTS (SELECT 1 FROM dbo.MedicalStaff WHERE Id = @StaffReception)
    INSERT INTO dbo.MedicalStaff (Id, ClinicId, FirstName, LastName, Email, CreatedBy)
    VALUES (@StaffReception, @ClinicId, N'Recepție', N'E2E', N'e2e.receptionist@valyanclinic.test', @AdminId);
IF NOT EXISTS (SELECT 1 FROM dbo.MedicalStaff WHERE Id = @StaffManager)
    INSERT INTO dbo.MedicalStaff (Id, ClinicId, FirstName, LastName, Email, CreatedBy)
    VALUES (@StaffManager, @ClinicId, N'Manager', N'E2E', N'e2e.manager@valyanclinic.test', @AdminId);
IF NOT EXISTS (SELECT 1 FROM dbo.MedicalStaff WHERE Id = @StaffNurse)
    INSERT INTO dbo.MedicalStaff (Id, ClinicId, FirstName, LastName, Email, CreatedBy)
    VALUES (@StaffNurse, @ClinicId, N'Asistentă', N'E2E', N'e2e.empty@valyanclinic.test', @AdminId);

DECLARE @Users TABLE (
    Id UNIQUEIDENTIFIER, Username NVARCHAR(100), Email NVARCHAR(200),
    FirstName NVARCHAR(100), RoleId UNIQUEIDENTIFIER,
    DoctorId UNIQUEIDENTIFIER NULL, MedicalStaffId UNIQUEIDENTIFIER NULL);

INSERT INTO @Users VALUES
    ('E2E00000-0000-0000-0000-00000000B001', N'e2e.doctor',       N'e2e.doctor@valyanclinic.test',       N'Doctor',    @RoleDoctor,       @DoctorId, NULL),
    ('E2E00000-0000-0000-0000-00000000B002', N'e2e.receptionist', N'e2e.receptionist@valyanclinic.test', N'Recepție',  @RoleReceptionist, NULL, @StaffReception),
    ('E2E00000-0000-0000-0000-00000000B003', N'e2e.manager',      N'e2e.manager@valyanclinic.test',      N'Manager',   @RoleManager,      NULL, @StaffManager),
    ('E2E00000-0000-0000-0000-00000000B004', N'e2e.empty',        N'e2e.empty@valyanclinic.test',        N'Asistentă', @RoleNurse,        NULL, @StaffNurse);

INSERT INTO dbo.Users
    (Id, ClinicId, RoleId, DoctorId, MedicalStaffId, Email, Username, PasswordHash,
     FirstName, LastName, IsActive, MustChangePassword, PasswordChangedAt, CreatedBy)
SELECT u.Id, @ClinicId, u.RoleId, u.DoctorId, u.MedicalStaffId, u.Email, u.Username, @Hash,
       u.FirstName, N'E2E', 1, 0, GETDATE(), @AdminId
FROM @Users u
WHERE NOT EXISTS (SELECT 1 FROM dbo.Users x WHERE x.Id = u.Id);

-- Conturile existente revin la starea de test (rol, legături, parolă, blocare)
UPDATE x SET
    RoleId = u.RoleId, DoctorId = u.DoctorId, MedicalStaffId = u.MedicalStaffId,
    PasswordHash = @Hash, IsActive = 1, IsDeleted = 0, FailedLoginAttempts = 0,
    LockoutEnd = NULL, MustChangePassword = 0, PasswordChangedAt = GETDATE()
FROM dbo.Users x INNER JOIN @Users u ON u.Id = x.Id;

-- e2e.empty: nurse fără niciun modul care alimentează dashboard-ul (dashboard rămâne Read)
DECLARE @EmptyUser UNIQUEIDENTIFIER = 'E2E00000-0000-0000-0000-00000000B004';
INSERT INTO dbo.UserModuleOverrides (UserId, ModuleId, AccessLevelId, Reason, GrantedBy)
SELECT @EmptyUser, m.Id, @LevelNone, N'E2E: dashboard fără widget-uri', @AdminId
FROM dbo.Modules m
WHERE m.Code IN (N'patients', N'appointments', N'consultations', N'prescriptions')
  AND NOT EXISTS (SELECT 1 FROM dbo.UserModuleOverrides o WHERE o.UserId = @EmptyUser AND o.ModuleId = m.Id);

COMMIT TRANSACTION;

PRINT N'Seed E2E: conturi de rol pregătite.';
