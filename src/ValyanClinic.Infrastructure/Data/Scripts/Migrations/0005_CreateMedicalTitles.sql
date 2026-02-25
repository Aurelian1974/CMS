-- ============================================================================
-- Migrare: 0005_CreateMedicalTitles.sql
-- Descriere: Creare tabel MedicalTitles (titulatură personal medical) + seed data
-- Data: 2026-02-25
-- ============================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'MedicalTitles')
BEGIN
    CREATE TABLE MedicalTitles (
        Id           UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        Name         NVARCHAR(100)    NOT NULL,
        Code         NVARCHAR(20)     NOT NULL,
        Description  NVARCHAR(500)    NULL,
        DisplayOrder INT              NOT NULL DEFAULT 0,
        IsActive     BIT              NOT NULL DEFAULT 1,
        CreatedAt    DATETIME2        NOT NULL DEFAULT GETDATE(),
        UpdatedAt    DATETIME2        NULL,

        CONSTRAINT UQ_MedicalTitles_Code UNIQUE (Code)
    );
END;
GO

-- Indexuri
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MedicalTitles_IsActive' AND object_id = OBJECT_ID('MedicalTitles'))
    CREATE INDEX IX_MedicalTitles_IsActive ON MedicalTitles(IsActive);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_MedicalTitles_DisplayOrder' AND object_id = OBJECT_ID('MedicalTitles'))
    CREATE INDEX IX_MedicalTitles_DisplayOrder ON MedicalTitles(DisplayOrder);
GO

-- ============================================================================
-- Seed data — Titulaturi personal medical România
-- ============================================================================

IF NOT EXISTS (SELECT 1 FROM MedicalTitles WHERE Code = 'MEDIC')
BEGIN
    INSERT INTO MedicalTitles (Name, Code, Description, DisplayOrder, IsActive)
    VALUES
    (N'Medic',                   'MEDIC',            N'Medic cu drept de liberă practică',                           1,  1),
    (N'Medic rezident',          'MEDIC_REZIDENT',   N'Medic în perioada de pregătire în rezidențiat',               2,  1),
    (N'Medic specialist',        'MEDIC_SPECIALIST', N'Medic cu titlul de specialist în specialitatea obținută',     3,  1),
    (N'Medic primar',            'MEDIC_PRIMAR',     N'Medic cu gradul profesional de medic primar',                 4,  1),
    (N'Medic dentist',           'MEDIC_DENTIST',    N'Medic stomatolog / dentist',                                  5,  1),
    (N'Medic dentist specialist','MEDIC_DENT_SPEC',  N'Medic dentist cu titlul de specialist',                       6,  1),
    (N'Medic dentist primar',    'MEDIC_DENT_PRIM',  N'Medic dentist cu gradul profesional de primar',               7,  1),
    (N'Farmacist',               'FARMACIST',        N'Specialist în farmacie clinică sau comunitară',               8,  1),
    (N'Farmacist specialist',    'FARMACIST_SPEC',   N'Farmacist cu titlul de specialist',                           9,  1),
    (N'Farmacist primar',        'FARMACIST_PRIM',   N'Farmacist cu gradul profesional de primar',                   10, 1),
    (N'Asistent medical',        'ASISTENT',         N'Asistent medical generalist',                                 11, 1),
    (N'Asistent medical principal','ASISTENT_PRINC', N'Asistent medical cu gradul de principal',                     12, 1),
    (N'Moașă',                   'MOASA',            N'Moașă — asistență în obstetrică și ginecologie',              13, 1),
    (N'Infirmier',               'INFIRMIER',        N'Personal auxiliar — îngrijire pacienți',                      14, 1),
    (N'Brancardier',             'BRANCARDIER',      N'Personal auxiliar — transport pacienți',                      15, 1),
    (N'Fizioterapeut',           'FIZIOTERAPEUT',    N'Specialist în kinetoterapie și recuperare fizică',            16, 1),
    (N'Psiholog clinician',      'PSIHOLOG',         N'Psiholog cu drept de liberă practică în psihologie clinică', 17, 1),
    (N'Logoped',                 'LOGOPED',          N'Specialist în terapia tulburărilor de limbaj și comunicare',  18, 1),
    (N'Nutriționist',            'NUTRITIONIST',     N'Specialist în dietetică și nutriție',                         19, 1),
    (N'Biochimist medical',      'BIOCHIMIST',       N'Specialist în biochimie de laborator',                        20, 1),
    (N'Biolog medical',          'BIOLOG',           N'Biolog cu competențe în laborator medical',                   21, 1),
    (N'Chimist medical',         'CHIMIST',          N'Specialist în chimie medicală de laborator',                  22, 1),
    (N'Tehnician medical',       'TEHNICIAN',        N'Tehnician medical (laborator, radiologie, etc.)',             23, 1),
    (N'Registrator medical',     'REGISTRATOR',      N'Personal administrativ — registratură medicală',              24, 1),
    (N'Îngrijitor',              'INGRIJITOR',       N'Personal auxiliar — curățenie și igienă',                     25, 1);

    PRINT N'Seed data MedicalTitles inserat cu succes.';
END;
GO
