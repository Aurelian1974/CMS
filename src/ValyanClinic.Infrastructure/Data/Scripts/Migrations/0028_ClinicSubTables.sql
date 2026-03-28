-- ============================================================================
-- MIGRARE: Adăugare tabele ClinicBankAccounts, ClinicAddresses, ClinicContacts
-- Migrează datele existente din Clinics în noile tabele
-- ============================================================================
SET NOCOUNT ON;
GO

-- ─── 1. ClinicBankAccounts ──────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ClinicBankAccounts')
BEGIN
    CREATE TABLE dbo.ClinicBankAccounts
    (
        Id        UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() CONSTRAINT PK_ClinicBankAccounts PRIMARY KEY,
        ClinicId  UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_ClinicBankAccounts_Clinics REFERENCES dbo.Clinics(Id),
        BankName  NVARCHAR(100)    NOT NULL,
        Iban      NVARCHAR(34)     NOT NULL,
        Currency  NVARCHAR(3)      NOT NULL CONSTRAINT DF_ClinicBankAccounts_Currency DEFAULT 'RON',
        IsMain    BIT              NOT NULL CONSTRAINT DF_ClinicBankAccounts_IsMain    DEFAULT 0,
        Notes     NVARCHAR(500)    NULL,
        IsDeleted BIT              NOT NULL CONSTRAINT DF_ClinicBankAccounts_IsDeleted DEFAULT 0,
        CreatedAt DATETIME2        NOT NULL CONSTRAINT DF_ClinicBankAccounts_CreatedAt DEFAULT GETDATE(),
        UpdatedAt DATETIME2        NULL
    );
    PRINT 'Tabel ClinicBankAccounts creat.';
END
ELSE
    PRINT 'Tabel ClinicBankAccounts există deja — ignorat.';
GO

-- ─── 2. ClinicAddresses ─────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ClinicAddresses')
BEGIN
    CREATE TABLE dbo.ClinicAddresses
    (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() CONSTRAINT PK_ClinicAddresses PRIMARY KEY,
        ClinicId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_ClinicAddresses_Clinics REFERENCES dbo.Clinics(Id),
        -- Tip adresă: 'Sediu Social', 'Corespondenta', 'Punct de Lucru', 'Depozit', 'Alta'
        AddressType NVARCHAR(50)     NOT NULL,
        Street      NVARCHAR(500)    NOT NULL,
        City        NVARCHAR(100)    NOT NULL,
        County      NVARCHAR(100)    NOT NULL,
        PostalCode  NVARCHAR(10)     NULL,
        Country     NVARCHAR(100)    NOT NULL CONSTRAINT DF_ClinicAddresses_Country DEFAULT N'România',
        IsMain      BIT              NOT NULL CONSTRAINT DF_ClinicAddresses_IsMain    DEFAULT 0,
        IsDeleted   BIT              NOT NULL CONSTRAINT DF_ClinicAddresses_IsDeleted DEFAULT 0,
        CreatedAt   DATETIME2        NOT NULL CONSTRAINT DF_ClinicAddresses_CreatedAt DEFAULT GETDATE(),
        UpdatedAt   DATETIME2        NULL
    );
    PRINT 'Tabel ClinicAddresses creat.';
END
ELSE
    PRINT 'Tabel ClinicAddresses există deja — ignorat.';
GO

-- ─── 3. ClinicContacts ──────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ClinicContacts')
BEGIN
    CREATE TABLE dbo.ClinicContacts
    (
        Id          UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() CONSTRAINT PK_ClinicContacts PRIMARY KEY,
        ClinicId    UNIQUEIDENTIFIER NOT NULL CONSTRAINT FK_ClinicContacts_Clinics REFERENCES dbo.Clinics(Id),
        -- Tip contact: 'Email', 'Telefon', 'Website', 'Fax'
        ContactType NVARCHAR(20)     NOT NULL,
        Value       NVARCHAR(200)    NOT NULL,
        Label       NVARCHAR(100)    NULL,  -- ex: 'General', 'Contabilitate', 'Urgente'
        IsMain      BIT              NOT NULL CONSTRAINT DF_ClinicContacts_IsMain    DEFAULT 0,
        IsDeleted   BIT              NOT NULL CONSTRAINT DF_ClinicContacts_IsDeleted DEFAULT 0,
        CreatedAt   DATETIME2        NOT NULL CONSTRAINT DF_ClinicContacts_CreatedAt DEFAULT GETDATE(),
        UpdatedAt   DATETIME2        NULL
    );
    PRINT 'Tabel ClinicContacts creat.';
END
ELSE
    PRINT 'Tabel ClinicContacts există deja — ignorat.';
GO

-- ─── 4. Migrare date existente din Clinics ──────────────────────────────────

-- Bank accounts: migrare BankName + BankAccount din Clinics
INSERT INTO dbo.ClinicBankAccounts (ClinicId, BankName, Iban, Currency, IsMain)
SELECT Id, BankName, BankAccount, 'RON', 1
FROM dbo.Clinics
WHERE BankName IS NOT NULL
  AND BankAccount IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM dbo.ClinicBankAccounts WHERE ClinicId = dbo.Clinics.Id);
PRINT CAST(@@ROWCOUNT AS VARCHAR) + ' conturi bancare migrate.';

-- Adrese: migrare Address + City + County + PostalCode din Clinics ca 'Sediu Social'
INSERT INTO dbo.ClinicAddresses (ClinicId, AddressType, Street, City, County, PostalCode, IsMain)
SELECT Id, N'Sediu Social', Address, City, County, PostalCode, 1
FROM dbo.Clinics
WHERE Address IS NOT NULL AND Address <> ''
  AND NOT EXISTS (SELECT 1 FROM dbo.ClinicAddresses WHERE ClinicId = dbo.Clinics.Id);
PRINT CAST(@@ROWCOUNT AS VARCHAR) + ' adrese migrate.';

-- Contacte: Email
INSERT INTO dbo.ClinicContacts (ClinicId, ContactType, Value, Label, IsMain)
SELECT Id, 'Email', Email, N'General', 1
FROM dbo.Clinics
WHERE Email IS NOT NULL AND Email <> ''
  AND NOT EXISTS (SELECT 1 FROM dbo.ClinicContacts WHERE ClinicId = dbo.Clinics.Id AND ContactType = 'Email');
PRINT CAST(@@ROWCOUNT AS VARCHAR) + ' emailuri migrate.';

-- Contacte: Telefon
INSERT INTO dbo.ClinicContacts (ClinicId, ContactType, Value, Label, IsMain)
SELECT Id, 'Telefon', PhoneNumber, N'General', 1
FROM dbo.Clinics
WHERE PhoneNumber IS NOT NULL AND PhoneNumber <> ''
  AND NOT EXISTS (SELECT 1 FROM dbo.ClinicContacts WHERE ClinicId = dbo.Clinics.Id AND ContactType = 'Telefon');
PRINT CAST(@@ROWCOUNT AS VARCHAR) + ' telefoane migrate.';

-- Contacte: Website
INSERT INTO dbo.ClinicContacts (ClinicId, ContactType, Value, Label, IsMain)
SELECT Id, 'Website', Website, NULL, 0
FROM dbo.Clinics
WHERE Website IS NOT NULL AND Website <> ''
  AND NOT EXISTS (SELECT 1 FROM dbo.ClinicContacts WHERE ClinicId = dbo.Clinics.Id AND ContactType = 'Website');
PRINT CAST(@@ROWCOUNT AS VARCHAR) + ' website-uri migrate.';

PRINT 'Migrare completă.';
GO
