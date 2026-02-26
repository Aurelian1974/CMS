-- =============================================================================
-- Migrare 0013: Creare tabele nomenclator AllergyTypes și AllergySeverities + seed
-- =============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ==================== TABEL ALLERGY TYPES ====================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AllergyTypes')
BEGIN
    CREATE TABLE AllergyTypes (
        Id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Name     NVARCHAR(100)    NOT NULL,
        Code     NVARCHAR(20)     NOT NULL,
        IsActive BIT              NOT NULL DEFAULT 1
    );

    PRINT 'Tabelul AllergyTypes a fost creat.';
END;
GO

-- ==================== SEED ALLERGY TYPES ====================

IF NOT EXISTS (SELECT 1 FROM AllergyTypes WHERE Id = 'E0030001-0000-0000-0000-000000000001')
BEGIN
    INSERT INTO AllergyTypes (Id, Name, Code, IsActive) VALUES
        ('E0030001-0000-0000-0000-000000000001', N'Medicament',    'DRUG',          1),
        ('E0030001-0000-0000-0000-000000000002', N'Alimentară',    'FOOD',          1),
        ('E0030001-0000-0000-0000-000000000003', N'Mediu',         'ENVIRONMENTAL', 1),
        ('E0030001-0000-0000-0000-000000000004', N'Latex',         'LATEX',         1),
        ('E0030001-0000-0000-0000-000000000005', N'Insecte',       'INSECT',        1),
        ('E0030001-0000-0000-0000-000000000006', N'Contact',       'CONTACT',       1),
        ('E0030001-0000-0000-0000-000000000007', N'Altele',        'OTHER',         1);

    PRINT 'Seed AllergyTypes: 7 înregistrări inserate.';
END;
GO

-- ==================== TABEL ALLERGY SEVERITIES ====================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AllergySeverities')
BEGIN
    CREATE TABLE AllergySeverities (
        Id       UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Name     NVARCHAR(50)     NOT NULL,
        Code     NVARCHAR(20)     NOT NULL,
        IsActive BIT              NOT NULL DEFAULT 1
    );

    PRINT 'Tabelul AllergySeverities a fost creat.';
END;
GO

-- ==================== SEED ALLERGY SEVERITIES ====================

IF NOT EXISTS (SELECT 1 FROM AllergySeverities WHERE Id = 'E0040001-0000-0000-0000-000000000001')
BEGIN
    INSERT INTO AllergySeverities (Id, Name, Code, IsActive) VALUES
        ('E0040001-0000-0000-0000-000000000001', N'Ușoară',     'MILD',       1),
        ('E0040001-0000-0000-0000-000000000002', N'Moderată',   'MODERATE',   1),
        ('E0040001-0000-0000-0000-000000000003', N'Severă',     'SEVERE',     1),
        ('E0040001-0000-0000-0000-000000000004', N'Anafilaxie', 'ANAPHYLAXIS', 1);

    PRINT 'Seed AllergySeverities: 4 înregistrări inserate.';
END;
GO

PRINT 'Migrarea 0013_CreateAllergyTypesAndSeverities.sql finalizată cu succes.';
GO
