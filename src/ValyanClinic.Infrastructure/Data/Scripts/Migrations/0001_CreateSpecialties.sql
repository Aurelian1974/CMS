-- ============================================================================
-- Migrare: 0001_CreateSpecialties.sql
-- Descriere: Creare tabel Specialties (ierarhic, self-referencing) + seed data
--            cu specializările medicale din România (CMR)
-- Data: 2026-02-24
-- ============================================================================

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Specialties')
BEGIN
    CREATE TABLE Specialties (
        Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        ParentId        UNIQUEIDENTIFIER NULL,
        Name            NVARCHAR(150)    NOT NULL,
        Code            NVARCHAR(20)     NOT NULL,
        Description     NVARCHAR(500)    NULL,
        DisplayOrder    INT              NOT NULL DEFAULT 0,
        Level           TINYINT          NOT NULL DEFAULT 0,  -- 0=categorie, 1=specialitate, 2=subspecialitate
        IsActive        BIT              NOT NULL DEFAULT 1,
        CreatedAt       DATETIME2        NOT NULL DEFAULT GETDATE(),
        UpdatedAt       DATETIME2        NULL,

        CONSTRAINT FK_Specialties_Parent FOREIGN KEY (ParentId) REFERENCES Specialties(Id),
        CONSTRAINT UQ_Specialties_Code   UNIQUE (Code)
    );
END;
GO

-- Indexuri — afară din IF BEGIN...END, cu IF NOT EXISTS propriu
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Specialties_ParentId' AND object_id = OBJECT_ID('Specialties'))
    CREATE INDEX IX_Specialties_ParentId ON Specialties(ParentId) WHERE ParentId IS NOT NULL;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Specialties_IsActive' AND object_id = OBJECT_ID('Specialties'))
    CREATE INDEX IX_Specialties_IsActive ON Specialties(IsActive);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Specialties_Level' AND object_id = OBJECT_ID('Specialties'))
    CREATE INDEX IX_Specialties_Level ON Specialties(Level);
GO

-- ============================================================================
-- Seed data — Specializări medicale România (nomenclator CMR)
-- Structură: Categorie (Level 0) → Specializare (Level 1) → Subspecializare (Level 2)
-- ============================================================================

-- ==================== CATEGORII (Level 0) ====================
-- Id-uri fixe pentru categorii, ușor de referit

DECLARE @CatMedicale    UNIQUEIDENTIFIER = 'C0000001-0000-0000-0000-000000000001';
DECLARE @CatChirurgicale UNIQUEIDENTIFIER = 'C0000001-0000-0000-0000-000000000002';
DECLARE @CatParaclinice UNIQUEIDENTIFIER = 'C0000001-0000-0000-0000-000000000003';
DECLARE @CatATI         UNIQUEIDENTIFIER = 'C0000001-0000-0000-0000-000000000004';
DECLARE @CatSP          UNIQUEIDENTIFIER = 'C0000001-0000-0000-0000-000000000005';

IF NOT EXISTS (SELECT 1 FROM Specialties WHERE Code = 'CAT_MED')
BEGIN
    -- ==================== CATEGORII ====================
    INSERT INTO Specialties (Id, ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@CatMedicale,     NULL, N'Specialități Medicale/Clinice', 'CAT_MED',  N'Specialități de medicină internă și clinică', 1, 0, 1),
    (@CatChirurgicale, NULL, N'Specialități Chirurgicale',     'CAT_CHIR', N'Specialități chirurgicale și intervenționale', 2, 0, 1),
    (@CatParaclinice,  NULL, N'Specialități Paraclinice',      'CAT_PARA', N'Specialități de diagnostic și laborator',     3, 0, 1),
    (@CatATI,          NULL, N'ATI și Urgență',                'CAT_ATI',  N'Anestezie, terapie intensivă și urgență',     4, 0, 1),
    (@CatSP,           NULL, N'Sănătate Publică și Management','CAT_SP',   N'Sănătate publică, epidemiologie, management', 5, 0, 1);

    -- ==================== SPECIALITĂȚI MEDICALE/CLINICE (Level 1) ====================
    DECLARE @MedFamilie     UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000001';
    DECLARE @MedInterna     UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000002';
    DECLARE @Cardiologie    UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000003';
    DECLARE @Gastro         UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000004';
    DECLARE @Pneumologie    UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000005';
    DECLARE @Nefrologie     UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000006';
    DECLARE @Endocrino      UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000007';
    DECLARE @Hematologie    UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000008';
    DECLARE @Reumatologie   UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000009';
    DECLARE @Neurologie     UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000010';
    DECLARE @Psihiatrie     UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000011';
    DECLARE @Pediatrie      UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000012';
    DECLARE @Dermato        UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000013';
    DECLARE @Oncologie      UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000014';
    DECLARE @BoliInfect     UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000015';
    DECLARE @Alergologie    UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000016';
    DECLARE @Geriatrie      UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000017';
    DECLARE @Neonatologie   UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000018';
    DECLARE @MedMuncii      UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000019';
    DECLARE @MedSport       UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000020';
    DECLARE @Recuperare     UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000021';
    DECLARE @MedNucleara    UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000022';
    DECLARE @Genetica       UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000023';
    DECLARE @Farmacologie   UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000024';
    DECLARE @RadioOnco      UNIQUEIDENTIFIER = 'A0000001-0000-0000-0000-000000000025';

    INSERT INTO Specialties (Id, ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@MedFamilie,   @CatMedicale, N'Medicină de familie',                     'MED_FAM',    N'Îngrijire primară, continuă și completă',                         1,  1, 1),
    (@MedInterna,   @CatMedicale, N'Medicină internă',                        'MED_INT',    N'Diagnostic și tratament boli interne adulți',                     2,  1, 1),
    (@Cardiologie,  @CatMedicale, N'Cardiologie',                             'CARDIO',     N'Boli ale inimii și sistemului cardiovascular',                    3,  1, 1),
    (@Gastro,       @CatMedicale, N'Gastroenterologie',                       'GASTRO',     N'Boli ale aparatului digestiv',                                    4,  1, 1),
    (@Pneumologie,  @CatMedicale, N'Pneumologie',                             'PNEUMO',     N'Boli ale aparatului respirator',                                  5,  1, 1),
    (@Nefrologie,   @CatMedicale, N'Nefrologie',                              'NEFRO',      N'Boli ale rinichilor și aparatului urinar',                        6,  1, 1),
    (@Endocrino,    @CatMedicale, N'Endocrinologie',                          'ENDOCRINO',  N'Boli ale glandelor endocrine, diabet, metabolism',                7,  1, 1),
    (@Hematologie,  @CatMedicale, N'Hematologie',                             'HEMATO',     N'Boli ale sângelui și organelor hematopoietice',                   8,  1, 1),
    (@Reumatologie, @CatMedicale, N'Reumatologie',                            'REUMATO',    N'Boli reumatismale, autoimune, ale aparatului locomotor',           9,  1, 1),
    (@Neurologie,   @CatMedicale, N'Neurologie',                              'NEURO',      N'Boli ale sistemului nervos central și periferic',                 10, 1, 1),
    (@Psihiatrie,   @CatMedicale, N'Psihiatrie',                              'PSIHIATRIE', N'Tulburări psihice și de comportament',                            11, 1, 1),
    (@Pediatrie,    @CatMedicale, N'Pediatrie',                               'PEDIATRIE',  N'Medicina copilului de la naștere la 18 ani',                      12, 1, 1),
    (@Dermato,      @CatMedicale, N'Dermatovenerologie',                      'DERMATO',    N'Boli ale pielii și infecții cu transmitere sexuală',              13, 1, 1),
    (@Oncologie,    @CatMedicale, N'Oncologie medicală',                      'ONCO_MED',   N'Diagnostic și tratament non-chirurgical al cancerului',           14, 1, 1),
    (@BoliInfect,   @CatMedicale, N'Boli infecțioase',                        'BOLI_INF',   N'Diagnostic și tratament boli infecțioase și tropicale',           15, 1, 1),
    (@Alergologie,  @CatMedicale, N'Alergologie și imunologie clinică',       'ALERGO',     N'Reacții alergice și tulburări ale sistemului imunitar',           16, 1, 1),
    (@Geriatrie,    @CatMedicale, N'Geriatrie și gerontologie',               'GERIATRIE',  N'Medicina vârstnicului',                                           17, 1, 1),
    (@Neonatologie, @CatMedicale, N'Neonatologie',                            'NEONATO',    N'Îngrijirea nou-născutului, inclusiv prematur',                    18, 1, 1),
    (@MedMuncii,    @CatMedicale, N'Medicina muncii',                         'MED_MUNCII', N'Sănătatea lucrătorilor și boli profesionale',                     19, 1, 1),
    (@MedSport,     @CatMedicale, N'Medicina sportivă',                       'MED_SPORT',  N'Medicina activității fizice și sportive',                         20, 1, 1),
    (@Recuperare,   @CatMedicale, N'Medicină fizică și de reabilitare',       'RECUP',      N'Recuperare, reabilitare, balneofizioterapie',                     21, 1, 1),
    (@MedNucleara,  @CatMedicale, N'Medicină nucleară',                       'MED_NUC',    N'Diagnostic și terapie cu substanțe radioactive',                  22, 1, 1),
    (@Genetica,     @CatMedicale, N'Genetică medicală',                       'GENETICA',   N'Diagnostic și consiliere genetică',                               23, 1, 1),
    (@Farmacologie, @CatMedicale, N'Farmacologie clinică',                    'FARMACO',    N'Studiul efectelor medicamentelor asupra pacienților',              24, 1, 1),
    (@RadioOnco,    @CatMedicale, N'Radioterapie',                            'RADIOTERAPIE', N'Tratamentul cancerului prin radiații ionizante',                 25, 1, 1);

    -- ==================== SPECIALITĂȚI CHIRURGICALE (Level 1) ====================
    DECLARE @ChirGen        UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000001';
    DECLARE @ChirCardiovasc UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000002';
    DECLARE @ChirToracica   UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000003';
    DECLARE @Neurochir      UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000004';
    DECLARE @ChirPlastica   UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000005';
    DECLARE @ChirPediatrica UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000006';
    DECLARE @Ortopedie      UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000007';
    DECLARE @Urologie       UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000008';
    DECLARE @ObGin          UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000009';
    DECLARE @Oftalmologie   UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000010';
    DECLARE @ORL            UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000011';
    DECLARE @ChirOMF        UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000012';
    DECLARE @ChirVasculara  UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000013';
    DECLARE @OncoChir       UNIQUEIDENTIFIER = 'A0000002-0000-0000-0000-000000000014';

    INSERT INTO Specialties (Id, ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@ChirGen,        @CatChirurgicale, N'Chirurgie generală',                       'CHIR_GEN',   N'Intervenții chirurgicale abdominale, endocrine, sân',         1,  1, 1),
    (@ChirCardiovasc, @CatChirurgicale, N'Chirurgie cardiovasculară',                'CHIR_CV',    N'Chirurgie pe inimă și vasele mari',                          2,  1, 1),
    (@ChirToracica,   @CatChirurgicale, N'Chirurgie toracică',                       'CHIR_TORAC', N'Chirurgie pe plămâni, mediastin, perete toracic',            3,  1, 1),
    (@Neurochir,      @CatChirurgicale, N'Neurochirurgie',                           'NEUROCHIR',  N'Chirurgie pe creier, măduva spinării, nervi periferici',      4,  1, 1),
    (@ChirPlastica,   @CatChirurgicale, N'Chirurgie plastică, estetică și microchirurgie reconstructivă', 'CHIR_PLAST', N'Reconstrucție, estetică, microchirurgie', 5, 1, 1),
    (@ChirPediatrica, @CatChirurgicale, N'Chirurgie pediatrică',                     'CHIR_PED',   N'Intervenții chirurgicale la copii',                          6,  1, 1),
    (@Ortopedie,      @CatChirurgicale, N'Ortopedie și traumatologie',               'ORTOPEDIE',  N'Boli și traumatisme ale aparatului locomotor',                7,  1, 1),
    (@Urologie,       @CatChirurgicale, N'Urologie',                                 'UROLOGIE',   N'Chirurgie aparatul urinar și genital masculin',               8,  1, 1),
    (@ObGin,          @CatChirurgicale, N'Obstetrică-ginecologie',                   'OB_GIN',     N'Sarcină, naștere, boli ginecologice',                        9,  1, 1),
    (@Oftalmologie,   @CatChirurgicale, N'Oftalmologie',                             'OFTALMO',    N'Boli ale ochilor și anexelor oculare',                        10, 1, 1),
    (@ORL,            @CatChirurgicale, N'Otorinolaringologie (ORL)',                'ORL',        N'Boli ale urechii, nasului, gâtului',                         11, 1, 1),
    (@ChirOMF,        @CatChirurgicale, N'Chirurgie oro-maxilo-facială',             'CHIR_OMF',   N'Chirurgie pe zona feței, maxilarelor, cavitatea bucală',     12, 1, 1),
    (@ChirVasculara,  @CatChirurgicale, N'Chirurgie vasculară',                      'CHIR_VASC',  N'Chirurgie pe vasele periferice',                             13, 1, 1),
    (@OncoChir,       @CatChirurgicale, N'Oncologie chirurgicală',                   'ONCO_CHIR',  N'Tratament chirurgical al tumorilor maligne',                 14, 1, 1);

    -- ==================== SPECIALITĂȚI PARACLINICE (Level 1) ====================
    DECLARE @Radiologie     UNIQUEIDENTIFIER = 'A0000003-0000-0000-0000-000000000001';
    DECLARE @AnatPato       UNIQUEIDENTIFIER = 'A0000003-0000-0000-0000-000000000002';
    DECLARE @MedLegala      UNIQUEIDENTIFIER = 'A0000003-0000-0000-0000-000000000003';
    DECLARE @LabMedical     UNIQUEIDENTIFIER = 'A0000003-0000-0000-0000-000000000004';
    DECLARE @Microbiologie  UNIQUEIDENTIFIER = 'A0000003-0000-0000-0000-000000000005';

    INSERT INTO Specialties (Id, ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@Radiologie,    @CatParaclinice, N'Radiologie-imagistică medicală',  'RADIO',     N'Diagnostic prin imagistică: radiografie, ecografie, CT, RMN',  1, 1, 1),
    (@AnatPato,      @CatParaclinice, N'Anatomie patologică',             'ANAT_PAT',  N'Diagnostic histopatologic și citologic',                       2, 1, 1),
    (@MedLegala,     @CatParaclinice, N'Medicină legală',                 'MED_LEG',   N'Expertize medico-legale, thanatologie',                        3, 1, 1),
    (@LabMedical,    @CatParaclinice, N'Laborator medical (Medicină de laborator)', 'LAB_MED', N'Analize biochimice, hematologice, imunologice',       4, 1, 1),
    (@Microbiologie, @CatParaclinice, N'Microbiologie medicală',          'MICROBIO',  N'Diagnostic microbiologic: bacterii, virusuri, fungi, paraziți', 5, 1, 1);

    -- ==================== ATI ȘI URGENȚĂ (Level 1) ====================
    DECLARE @ATI      UNIQUEIDENTIFIER = 'A0000004-0000-0000-0000-000000000001';
    DECLARE @Urgenta  UNIQUEIDENTIFIER = 'A0000004-0000-0000-0000-000000000002';

    INSERT INTO Specialties (Id, ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@ATI,     @CatATI, N'Anestezie și terapie intensivă (ATI)', 'ATI',       N'Anestezie chirurgicală și îngrijire critică',        1, 1, 1),
    (@Urgenta, @CatATI, N'Medicină de urgență',                  'URGENTA',   N'Evaluare și tratament urgențe medicale și chirurgicale', 2, 1, 1);

    -- ==================== SĂNĂTATE PUBLICĂ (Level 1) ====================
    DECLARE @SPManagement UNIQUEIDENTIFIER = 'A0000005-0000-0000-0000-000000000001';
    DECLARE @Epidemio     UNIQUEIDENTIFIER = 'A0000005-0000-0000-0000-000000000002';
    DECLARE @Igiena       UNIQUEIDENTIFIER = 'A0000005-0000-0000-0000-000000000003';

    INSERT INTO Specialties (Id, ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@SPManagement, @CatSP, N'Sănătate publică și management sanitar',  'SP_MGMT',  N'Organizare, planificare, management sisteme de sănătate', 1, 1, 1),
    (@Epidemio,     @CatSP, N'Epidemiologie',                           'EPIDEMIO', N'Studiul distribuției și determinanților bolilor',           2, 1, 1),
    (@Igiena,       @CatSP, N'Igienă și sănătate publică',              'IGIENA',   N'Prevenire boli, igienă mediu, alimentară, ocupațională',  3, 1, 1);

    -- ==================== SUBSPECIALITĂȚI (Level 2) ====================
    -- Subspecialități Cardiologie
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@Cardiologie, N'Cardiologie intervențională',             'CARDIO_INT',  N'Proceduri invazive cardiovasculare: angioplastie, stenting',  1, 2, 1),
    (@Cardiologie, N'Electrofiziologie cardiacă',              'CARDIO_EF',   N'Diagnostic și tratament aritmii cardiace',                    2, 2, 1),
    (@Cardiologie, N'Ecocardiografie',                         'CARDIO_ECO',  N'Ecografie cardiacă transtoracică și transesofagiană',         3, 2, 1);

    -- Subspecialități Gastroenterologie
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@Gastro, N'Hepatologie',                                  'HEPATO',      N'Boli ale ficatului și căilor biliare',                         1, 2, 1),
    (@Gastro, N'Endoscopie digestivă',                         'ENDO_DIG',    N'Proceduri endoscopice diagnostice și terapeutice',             2, 2, 1);

    -- Subspecialități Neurologie
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@Neurologie, N'Neurofiziologie clinică (EEG/EMG)',        'NEURO_FIZ',   N'Electroencefalografie, electromiografie',                      1, 2, 1),
    (@Neurologie, N'Neurologie vasculară',                     'NEURO_VASC',  N'AVC, boli cerebrovasculare',                                   2, 2, 1);

    -- Subspecialități Psihiatrie
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@Psihiatrie, N'Psihiatria copilului și adolescentului',   'PSIH_PED',    N'Tulburări psihice la copii și adolescenți',                    1, 2, 1),
    (@Psihiatrie, N'Psihiatrie de legătură',                   'PSIH_LEG',    N'Interfața psihiatrie - medicină somatică',                     2, 2, 1);

    -- Subspecialități Pediatrie
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@Pediatrie, N'Cardiologie pediatrică',                    'PED_CARDIO',  N'Boli cardiace congenitale și dobândite la copii',               1, 2, 1),
    (@Pediatrie, N'Neurologie pediatrică',                     'PED_NEURO',   N'Boli neurologice la copii',                                    2, 2, 1),
    (@Pediatrie, N'Endocrinologie pediatrică',                 'PED_ENDO',    N'Boli endocrine la copii, diabet juvenil',                      3, 2, 1),
    (@Pediatrie, N'Gastroenterologie pediatrică',              'PED_GASTRO',  N'Boli digestive la copii',                                      4, 2, 1),
    (@Pediatrie, N'Nefrologie pediatrică',                     'PED_NEFRO',   N'Boli renale la copii',                                         5, 2, 1),
    (@Pediatrie, N'Hematologie și oncologie pediatrică',       'PED_HEMATO',  N'Boli ale sângelui și cancer la copii',                         6, 2, 1),
    (@Pediatrie, N'Pneumologie pediatrică',                    'PED_PNEUMO',  N'Boli respiratorii la copii',                                   7, 2, 1);

    -- Subspecialități Endocrinologie
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@Endocrino, N'Diabet, nutriție și boli metabolice',       'DIABET_NUT',  N'Diabet zaharat, obezitate, boli metabolice',                   1, 2, 1);

    -- Subspecialități Obstetrică-Ginecologie
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@ObGin, N'Medicină materno-fetală',                       'OB_GIN_MF',   N'Sarcini cu risc, diagnostic prenatal',                         1, 2, 1),
    (@ObGin, N'Oncologie ginecologică',                        'OB_GIN_ONCO', N'Tratamentul cancerelor genitale feminine',                     2, 2, 1),
    (@ObGin, N'Medicină reproductivă (FIV)',                   'OB_GIN_FIV',  N'Infertilitate, fertilizare in vitro',                          3, 2, 1);

    -- Subspecialități Chirurgie generală
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@ChirGen, N'Chirurgie laparoscopică / minim invazivă',    'CHIR_LAPARO', N'Chirurgie prin abord minim invaziv',                           1, 2, 1),
    (@ChirGen, N'Chirurgie hepato-bilio-pancreatică',          'CHIR_HBP',    N'Chirurgia ficatului, căilor biliare, pancreasului',             2, 2, 1);

    -- Subspecialități Radiologie
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@Radiologie, N'Radiologie intervențională',               'RADIO_INT',   N'Proceduri minim invazive ghidate imagistic',                    1, 2, 1),
    (@Radiologie, N'Neuroradiologie',                          'NEURO_RADIO', N'Imagistică specializată craniu și coloană',                     2, 2, 1);

    -- Subspecialități ATI
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@ATI, N'Terapie intensivă pediatrică',                    'ATI_PED',     N'Îngrijire intensivă a copilului critic',                        1, 2, 1),
    (@ATI, N'Terapia durerii',                                 'ATI_DURERE',  N'Managementul durerii cronice',                                  2, 2, 1);

    -- Subspecialități Ortopedie
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@Ortopedie, N'Ortopedie pediatrică',                      'ORTO_PED',    N'Afecțiuni ortopedice congenitale și la copii',                  1, 2, 1),
    (@Ortopedie, N'Chirurgia coloanei vertebrale',             'ORTO_COLOANA',N'Intervenții pe coloana vertebrală',                             2, 2, 1);

    -- Subspecialități Oncologie medicală
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@Oncologie, N'Hematologie oncologică',                    'ONCO_HEMATO', N'Cancere hematologice: leucemii, limfoame',                     1, 2, 1);

    -- Subspecialități Hematologie
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@Hematologie, N'Transplant medular',                      'HEMATO_TX',   N'Transplant de celule stem hematopoietice',                     1, 2, 1);

    -- Subspecialități ORL
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@ORL, N'Audiologie și neurootologie',                     'ORL_AUDIO',   N'Tulburări de auz și echilibru',                                1, 2, 1),
    (@ORL, N'Chirurgie cervico-facială (ORL oncologică)',      'ORL_ONCO',    N'Tumori cap și gât',                                            2, 2, 1);

    -- Subspecialități Oftalmologie
    INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive)
    VALUES
    (@Oftalmologie, N'Chirurgie retino-vitreană',              'OFTALMO_RV',  N'Patologie retiniană și vitreană',                              1, 2, 1);

    PRINT 'Seed data Specialties inserat cu succes.';
END;
GO
