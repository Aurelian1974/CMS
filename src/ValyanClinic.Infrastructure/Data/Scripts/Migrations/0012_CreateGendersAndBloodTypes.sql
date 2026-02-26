-- =============================================================================
-- Migrare 0012: Creare tabele nomenclator Genders și BloodTypes + seed data
-- =============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ==================== TABEL GENDERS ====================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Genders')
BEGIN
    CREATE TABLE Genders (
        Id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Name     NVARCHAR(50)     NOT NULL,
        Code     NVARCHAR(10)     NOT NULL,
        IsActive BIT              NOT NULL DEFAULT 1
    );

    PRINT 'Tabelul Genders a fost creat.';
END;
GO

-- ==================== SEED GENDERS ====================

IF NOT EXISTS (SELECT 1 FROM Genders WHERE Id = 'E0010001-0000-0000-0000-000000000001')
BEGIN
    INSERT INTO Genders (Id, Name, Code, IsActive) VALUES
        ('E0010001-0000-0000-0000-000000000001', N'Masculin',     'M',  1),
        ('E0010001-0000-0000-0000-000000000002', N'Feminin',      'F',  1),
        ('E0010001-0000-0000-0000-000000000003', N'Nespecificat', 'NS', 1);

    PRINT 'Seed Genders: 3 înregistrări inserate.';
END;
GO

-- ==================== TABEL BLOOD TYPES ====================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'BloodTypes')
BEGIN
    CREATE TABLE BloodTypes (
        Id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Name     NVARCHAR(10)     NOT NULL,
        Code     NVARCHAR(10)     NOT NULL,
        IsActive BIT              NOT NULL DEFAULT 1
    );

    PRINT 'Tabelul BloodTypes a fost creat.';
END;
GO

-- ==================== SEED BLOOD TYPES ====================

IF NOT EXISTS (SELECT 1 FROM BloodTypes WHERE Id = 'E0020001-0000-0000-0000-000000000001')
BEGIN
    INSERT INTO BloodTypes (Id, Name, Code, IsActive) VALUES
        ('E0020001-0000-0000-0000-000000000001', N'A+',  'A_POS',  1),
        ('E0020001-0000-0000-0000-000000000002', N'A-',  'A_NEG',  1),
        ('E0020001-0000-0000-0000-000000000003', N'B+',  'B_POS',  1),
        ('E0020001-0000-0000-0000-000000000004', N'B-',  'B_NEG',  1),
        ('E0020001-0000-0000-0000-000000000005', N'AB+', 'AB_POS', 1),
        ('E0020001-0000-0000-0000-000000000006', N'AB-', 'AB_NEG', 1),
        ('E0020001-0000-0000-0000-000000000007', N'0+',  'O_POS',  1),
        ('E0020001-0000-0000-0000-000000000008', N'0-',  'O_NEG',  1);

    PRINT 'Seed BloodTypes: 8 înregistrări inserate.';
END;
GO

PRINT 'Migrarea 0012_CreateGendersAndBloodTypes.sql finalizată cu succes.';
GO
