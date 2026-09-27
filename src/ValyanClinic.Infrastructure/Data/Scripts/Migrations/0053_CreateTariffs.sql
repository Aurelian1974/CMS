-- ============================================================================
-- Migrare 0053: Nomenclator de tarife (servicii medicale cu prețuri versionate)
--   Clinics.IsVatPayer, VatRates, ServiceCategories, MedicalServices,
--   MedicalServicePrices, modulul de permisiuni 'tariffs'.
-- Prețurile sunt FINALE (TVA inclus, dacă se aplică). O versiune de preț nu se
-- modifică după ce a intrat în vigoare — se adaugă o versiune nouă.
-- Rollback: Scripts/Rollback/0053_Rollback_CreateTariffs.sql
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ── Clinics.IsVatPayer ───────────────────────────────────────────────────────
IF COL_LENGTH('dbo.Clinics', 'IsVatPayer') IS NULL
BEGIN
    ALTER TABLE dbo.Clinics ADD IsVatPayer BIT NOT NULL CONSTRAINT DF_Clinics_IsVatPayer DEFAULT 0;
    PRINT 'Coloana Clinics.IsVatPayer adăugată.';
END
GO

-- ── VatRates (regimuri / cote TVA — nomenclator global, editabil din UI) ─────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'VatRates')
BEGIN
    CREATE TABLE dbo.VatRates (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_VatRates_Id DEFAULT NEWSEQUENTIALID(),
        Code                NVARCHAR(30)     NOT NULL,
        Name                NVARCHAR(150)    NOT NULL,
        [Percent]           DECIMAL(5,2)     NOT NULL,
        -- Cod categorie TVA UBL / CIUS-RO (S = standard, E = scutit, O = în afara sferei, Z = cota zero)
        UblCategoryCode     NVARCHAR(3)      NOT NULL,
        -- Motivul scutirii (cod VATEX + text afișat pe factură) — obligatoriu la categoria E în e-Factura
        ExemptionReasonCode NVARCHAR(30)     NULL,
        ExemptionReasonText NVARCHAR(300)    NULL,
        SortOrder           INT              NOT NULL CONSTRAINT DF_VatRates_SortOrder DEFAULT 0,
        IsActive            BIT              NOT NULL CONSTRAINT DF_VatRates_IsActive DEFAULT 1,
        CreatedAt           DATETIME2(0)     NOT NULL CONSTRAINT DF_VatRates_CreatedAt DEFAULT GETDATE(),
        CreatedBy           UNIQUEIDENTIFIER NULL,
        UpdatedAt           DATETIME2(0)     NULL,
        UpdatedBy           UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_VatRates PRIMARY KEY (Id),
        CONSTRAINT UQ_VatRates_Code UNIQUE (Code),
        CONSTRAINT CK_VatRates_Percent CHECK ([Percent] >= 0 AND [Percent] < 100)
    );

    -- Doar regimul de scutire e seed-uit; temeiul legal și codul VATEX se validează cu contabilul
    INSERT INTO dbo.VatRates (Id, Code, Name, [Percent], UblCategoryCode, ExemptionReasonCode, ExemptionReasonText, SortOrder)
    VALUES ('F1000000-0000-0000-0000-000000000001', N'SCUTIT', N'Scutit de TVA (servicii medicale)', 0.00, N'E',
            NULL, N'Scutit de TVA conform art. 292 din Codul fiscal', 1);

    PRINT 'Tabel VatRates creat + seed.';
END
GO

-- ── ServiceCategories ────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ServiceCategories')
BEGIN
    CREATE TABLE dbo.ServiceCategories (
        Id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ServiceCategories_Id DEFAULT NEWSEQUENTIALID(),
        Code      NVARCHAR(30)     NOT NULL,
        Name      NVARCHAR(100)    NOT NULL,
        SortOrder INT              NOT NULL CONSTRAINT DF_ServiceCategories_SortOrder DEFAULT 0,
        IsActive  BIT              NOT NULL CONSTRAINT DF_ServiceCategories_IsActive DEFAULT 1,
        CONSTRAINT PK_ServiceCategories PRIMARY KEY (Id),
        CONSTRAINT UQ_ServiceCategories_Code UNIQUE (Code)
    );

    INSERT INTO dbo.ServiceCategories (Id, Code, Name, SortOrder) VALUES
        ('F2000000-0000-0000-0000-000000000001', N'CONSULTATIE',  N'Consultații',               1),
        ('F2000000-0000-0000-0000-000000000002', N'INVESTIGATIE', N'Investigații paraclinice',  2),
        ('F2000000-0000-0000-0000-000000000003', N'PROCEDURA',    N'Proceduri',                 3),
        ('F2000000-0000-0000-0000-000000000004', N'ALTELE',       N'Alte servicii',             4);

    PRINT 'Tabel ServiceCategories creat + seed.';
END
GO

-- ── MedicalServices ──────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MedicalServices')
BEGIN
    CREATE TABLE dbo.MedicalServices (
        Id                    UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_MedicalServices_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId              UNIQUEIDENTIFIER NOT NULL,
        Code                  NVARCHAR(30)     NOT NULL,
        Name                  NVARCHAR(200)    NOT NULL,
        CategoryId            UNIQUEIDENTIFIER NOT NULL,
        DurationMinutes       INT              NULL,
        -- Legătură opțională cu tipul de investigație (sugestie automată de linie în consultație)
        InvestigationTypeCode NVARCHAR(50)     NULL,
        IsActive              BIT              NOT NULL CONSTRAINT DF_MedicalServices_IsActive DEFAULT 1,
        IsDeleted             BIT              NOT NULL CONSTRAINT DF_MedicalServices_IsDeleted DEFAULT 0,
        RowVersion            ROWVERSION       NOT NULL,
        CreatedAt             DATETIME2(0)     NOT NULL CONSTRAINT DF_MedicalServices_CreatedAt DEFAULT GETDATE(),
        CreatedBy             UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt             DATETIME2(0)     NULL,
        UpdatedBy             UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_MedicalServices PRIMARY KEY (Id),
        CONSTRAINT FK_MedicalServices_Clinics    FOREIGN KEY (ClinicId)   REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_MedicalServices_Categories FOREIGN KEY (CategoryId) REFERENCES dbo.ServiceCategories(Id),
        CONSTRAINT FK_MedicalServices_InvestigationTypes FOREIGN KEY (InvestigationTypeCode)
            REFERENCES dbo.InvestigationTypeDefinitions(TypeCode),
        CONSTRAINT CK_MedicalServices_Duration CHECK (DurationMinutes IS NULL OR DurationMinutes > 0)
    );

    CREATE UNIQUE NONCLUSTERED INDEX UQ_MedicalServices_Clinic_Code
        ON dbo.MedicalServices (ClinicId, Code) WHERE IsDeleted = 0;

    CREATE NONCLUSTERED INDEX IX_MedicalServices_Clinic_Category
        ON dbo.MedicalServices (ClinicId, CategoryId) INCLUDE (Name, IsActive, IsDeleted);

    PRINT 'Tabel MedicalServices creat.';
END
GO

-- ── MedicalServicePrices (istoric: [ValidFrom, ValidTo)) ─────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MedicalServicePrices')
BEGIN
    CREATE TABLE dbo.MedicalServicePrices (
        Id               UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_MedicalServicePrices_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId         UNIQUEIDENTIFIER NOT NULL,
        MedicalServiceId UNIQUEIDENTIFIER NOT NULL,
        Price            DECIMAL(18,2)    NOT NULL,
        VatRateId        UNIQUEIDENTIFIER NOT NULL,
        ValidFrom        DATE             NOT NULL,
        -- Exclusiv; NULL = versiunea curentă, fără dată de sfârșit
        ValidTo          DATE             NULL,
        CreatedAt        DATETIME2(0)     NOT NULL CONSTRAINT DF_MedicalServicePrices_CreatedAt DEFAULT GETDATE(),
        CreatedBy        UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_MedicalServicePrices PRIMARY KEY (Id),
        CONSTRAINT FK_MedicalServicePrices_Services FOREIGN KEY (MedicalServiceId) REFERENCES dbo.MedicalServices(Id),
        CONSTRAINT FK_MedicalServicePrices_VatRates FOREIGN KEY (VatRateId)        REFERENCES dbo.VatRates(Id),
        CONSTRAINT CK_MedicalServicePrices_Price    CHECK (Price >= 0),
        CONSTRAINT CK_MedicalServicePrices_Interval CHECK (ValidTo IS NULL OR ValidTo > ValidFrom)
    );

    CREATE UNIQUE NONCLUSTERED INDEX UQ_MedicalServicePrices_Service_ValidFrom
        ON dbo.MedicalServicePrices (MedicalServiceId, ValidFrom)
        INCLUDE (ValidTo, Price, VatRateId);

    PRINT 'Tabel MedicalServicePrices creat.';
END
GO

-- ── Modulul de permisiuni 'tariffs' ──────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM dbo.Modules WHERE Code = 'tariffs')
    INSERT INTO dbo.Modules (Id, Code, Name, Description, SortOrder)
    VALUES ('E2000001-0000-0000-0000-000000000011', 'tariffs', N'Tarife',
            N'Nomenclatorul de servicii medicale și prețuri', 15);
GO

-- admin / clinic_manager = Full; doctor / nurse / receptionist = Read
INSERT INTO dbo.RoleModulePermissions (RoleId, ModuleId, AccessLevelId)
SELECT r.Id, m.Id, al.Id
FROM dbo.Roles r
CROSS JOIN dbo.Modules m
INNER JOIN dbo.AccessLevels al
    ON al.Level = CASE WHEN r.Code IN ('admin', 'clinic_manager') THEN 3 ELSE 1 END
WHERE m.Code = 'tariffs'
  AND r.Code IN ('admin', 'clinic_manager', 'doctor', 'nurse', 'receptionist')
  AND NOT EXISTS (SELECT 1 FROM dbo.RoleModulePermissions x WHERE x.RoleId = r.Id AND x.ModuleId = m.Id);
GO

-- Managerul de clinică stornează și administrează plățile (seed-ul inițial îi dădea doar Read)
UPDATE rmp SET AccessLevelId = (SELECT TOP 1 Id FROM dbo.AccessLevels WHERE Level = 3)
FROM dbo.RoleModulePermissions rmp
INNER JOIN dbo.Roles r        ON r.Id = rmp.RoleId
INNER JOIN dbo.Modules m      ON m.Id = rmp.ModuleId
INNER JOIN dbo.AccessLevels al ON al.Id = rmp.AccessLevelId
WHERE r.Code = 'clinic_manager' AND m.Code IN ('invoices', 'payments') AND al.Level = 1;
GO

PRINT 'Migrarea 0053_CreateTariffs finalizata cu succes.';
GO
