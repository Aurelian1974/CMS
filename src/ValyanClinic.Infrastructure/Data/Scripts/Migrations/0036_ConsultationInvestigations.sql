-- ============================================================================
-- Migrare 0036: Modul Investigatii Paraclinice
--
-- Tabele noi:
--   1. dbo.Documents                    - storage minimal pentru atasamente
--   2. dbo.InvestigationTypeDefinitions - configurare tipuri (seed cu ~30)
--   3. dbo.ConsultationInvestigations   - investigatii per consultatie (1:N)
--
-- Notes:
--   - Toate ID-urile UNIQUEIDENTIFIER pentru consistenta cu codebase-ul existent
--   - StructuredData NVARCHAR(MAX) cu CHECK ISJSON (cand NOT NULL)
--   - PatientId/DoctorId denormalizati pentru query-uri trending eficiente
--   - Specialties = CSV ('Pneumology,Cardiology') - matching simplu pe FE
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- ── 1. Tabel Documents (storage minimal) ────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Documents')
BEGIN
    CREATE TABLE dbo.Documents (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Documents_Id DEFAULT NEWID(),
        ClinicId        UNIQUEIDENTIFIER NOT NULL,
        FileName        NVARCHAR(260)    NOT NULL,
        ContentType     NVARCHAR(120)    NOT NULL,
        FileSize        BIGINT           NOT NULL,
        StoragePath     NVARCHAR(500)    NULL,    -- path relativ pe disc / blob URL
        FileBytes       VARBINARY(MAX)   NULL,    -- fallback in-DB pentru fisiere mici
        IsDeleted       BIT              NOT NULL CONSTRAINT DF_Documents_IsDeleted DEFAULT 0,
        CreatedAt       DATETIME2(0)     NOT NULL CONSTRAINT DF_Documents_CreatedAt DEFAULT SYSDATETIME(),
        CreatedBy       UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_Documents PRIMARY KEY (Id)
    );
    PRINT 'Tabel Documents creat.';
END
ELSE
    PRINT 'Tabel Documents exista deja - ignorat.';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Documents_ClinicId')
    CREATE INDEX IX_Documents_ClinicId ON dbo.Documents(ClinicId) WHERE IsDeleted = 0;
GO

-- ── 2. Tabel InvestigationTypeDefinitions ───────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'InvestigationTypeDefinitions')
BEGIN
    CREATE TABLE dbo.InvestigationTypeDefinitions (
        TypeCode                NVARCHAR(50)  NOT NULL,
        DisplayName             NVARCHAR(200) NOT NULL,
        DisplayNameEn           NVARCHAR(200) NULL,
        Category                NVARCHAR(50)  NOT NULL,   -- Respiratory/Cardiac/Sleep/Metabolic/Imaging/Procedure
        ParentTab               NVARCHAR(20)  NOT NULL,   -- Lab/Imaging/Functional/Procedures
        UIPattern               NVARCHAR(20)  NOT NULL,   -- Narrative/Structured/LabTable/Questionnaire
        Specialties             NVARCHAR(200) NOT NULL,   -- CSV: 'Pneumology,Cardiology'
        HasStructuredFields     BIT           NOT NULL CONSTRAINT DF_InvTypeDef_HasStructuredFields DEFAULT 0,
        DefaultStructuredEntry  BIT           NOT NULL CONSTRAINT DF_InvTypeDef_DefaultStructuredEntry DEFAULT 1,
        JsonSchemaVersion       NVARCHAR(10)  NOT NULL CONSTRAINT DF_InvTypeDef_JsonSchemaVersion DEFAULT '1.0',
        IsActive                BIT           NOT NULL CONSTRAINT DF_InvTypeDef_IsActive DEFAULT 1,
        SortOrder               INT           NOT NULL CONSTRAINT DF_InvTypeDef_SortOrder DEFAULT 0,
        CONSTRAINT PK_InvestigationTypeDefinitions PRIMARY KEY (TypeCode)
    );
    PRINT 'Tabel InvestigationTypeDefinitions creat.';
END
ELSE
    PRINT 'Tabel InvestigationTypeDefinitions exista deja - ignorat.';
GO

-- ── 3. Tabel ConsultationInvestigations ─────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ConsultationInvestigations')
BEGIN
    CREATE TABLE dbo.ConsultationInvestigations (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_ConsultationInvestigations_Id DEFAULT NEWID(),
        ClinicId            UNIQUEIDENTIFIER NOT NULL,
        ConsultationId      UNIQUEIDENTIFIER NOT NULL,
        PatientId           UNIQUEIDENTIFIER NOT NULL,    -- denormalizat (trending)
        DoctorId            UNIQUEIDENTIFIER NOT NULL,    -- denormalizat (trending)
        InvestigationType   NVARCHAR(50)     NOT NULL,    -- FK -> InvestigationTypeDefinitions.TypeCode
        InvestigationDate   DATE             NOT NULL,
        StructuredData      NVARCHAR(MAX)    NULL,        -- JSON tipizat
        Narrative           NVARCHAR(MAX)    NULL,        -- HTML din RTE
        IsExternal          BIT              NOT NULL CONSTRAINT DF_ConsInv_IsExternal DEFAULT 0,
        ExternalSource      NVARCHAR(200)    NULL,
        Status              TINYINT          NOT NULL CONSTRAINT DF_ConsInv_Status DEFAULT 2,  -- 0=Requested,1=Pending,2=Completed,3=Cancelled
        AttachedDocumentId  UNIQUEIDENTIFIER NULL,
        HasStructuredData   BIT              NOT NULL CONSTRAINT DF_ConsInv_HasStructuredData DEFAULT 0,
        IsDeleted           BIT              NOT NULL CONSTRAINT DF_ConsInv_IsDeleted DEFAULT 0,
        CreatedAt           DATETIME2(0)     NOT NULL CONSTRAINT DF_ConsInv_CreatedAt DEFAULT SYSDATETIME(),
        CreatedBy           UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt           DATETIME2(0)     NULL,
        UpdatedBy           UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_ConsultationInvestigations PRIMARY KEY (Id),
        CONSTRAINT FK_ConsInv_Consultation FOREIGN KEY (ConsultationId) REFERENCES dbo.Consultations(Id) ON DELETE CASCADE,
        CONSTRAINT FK_ConsInv_Type         FOREIGN KEY (InvestigationType) REFERENCES dbo.InvestigationTypeDefinitions(TypeCode),
        CONSTRAINT FK_ConsInv_Document     FOREIGN KEY (AttachedDocumentId) REFERENCES dbo.Documents(Id),
        CONSTRAINT CK_ConsInv_StructuredDataJson CHECK (StructuredData IS NULL OR ISJSON(StructuredData) = 1)
    );
    PRINT 'Tabel ConsultationInvestigations creat.';
END
ELSE
    PRINT 'Tabel ConsultationInvestigations exista deja - ignorat.';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ConsInv_Patient')
    CREATE INDEX IX_ConsInv_Patient ON dbo.ConsultationInvestigations (PatientId, InvestigationDate DESC) WHERE IsDeleted = 0;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ConsInv_Consultation')
    CREATE INDEX IX_ConsInv_Consultation ON dbo.ConsultationInvestigations (ConsultationId) WHERE IsDeleted = 0;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ConsInv_Type')
    CREATE INDEX IX_ConsInv_Type ON dbo.ConsultationInvestigations (InvestigationType, PatientId, InvestigationDate DESC) WHERE IsDeleted = 0;
GO

-- ── 4. Seed InvestigationTypeDefinitions ────────────────────────────────────
MERGE dbo.InvestigationTypeDefinitions AS t
USING (VALUES
    -- (TypeCode, DisplayName, Category, ParentTab, UIPattern, Specialties, HasStructured, DefaultStructured, SortOrder)
    -- Explorari functionale respiratorii
    ('Spirometry',         N'Spirometrie',                   'Respiratory', 'Functional', 'Structured',    'Pneumology',                       1, 1,  10),
    ('DLCO',               N'Difuziune CO (DLCO)',           'Respiratory', 'Functional', 'Structured',    'Pneumology',                       1, 1,  20),
    ('ABG',                N'Gazometrie arteriala',          'Respiratory', 'Functional', 'Structured',    'Pneumology,Cardiology',            1, 1,  30),
    ('Oximetry',           N'Pulsoximetrie',                 'Respiratory', 'Functional', 'Structured',    'Pneumology,Cardiology',            1, 1,  40),
    ('SixMWT',             N'Test de mers 6 minute',         'Respiratory', 'Functional', 'Structured',    'Pneumology,Cardiology',            1, 1,  50),
    -- Explorari functionale cardiace
    ('ECG',                N'Electrocardiograma (EKG)',      'Cardiac',     'Functional', 'Structured',    'Cardiology,Pneumology,Diabetology',1, 1,  60),
    ('Echocardiography',   N'Ecocardiografie',               'Cardiac',     'Functional', 'Structured',    'Cardiology,Pneumology',            1, 0,  70),
    ('Holter_ECG',         N'Holter EKG',                    'Cardiac',     'Functional', 'Structured',    'Cardiology,Pneumology',            1, 0,  80),
    ('Holter_BP',          N'Holter TA (ABPM)',              'Cardiac',     'Functional', 'Structured',    'Cardiology,Diabetology',           1, 0,  90),
    ('StressTest',         N'Proba de efort',                'Cardiac',     'Functional', 'Structured',    'Cardiology',                       1, 0, 100),
    -- Somn
    ('PSG_Diagnostic',     N'Polisomnografie diagnostica',   'Sleep',       'Functional', 'Structured',    'Pneumology',                       1, 0, 110),
    ('PSG_SplitNight',     N'Polisomnografie split-night',   'Sleep',       'Functional', 'Structured',    'Pneumology',                       1, 0, 120),
    ('CPAP_Titration',     N'Titrare CPAP/BiPAP',            'Sleep',       'Functional', 'Structured',    'Pneumology',                       1, 0, 130),
    ('CPAP_FollowUp',      N'Follow-up CPAP',                'Sleep',       'Functional', 'Structured',    'Pneumology',                       1, 1, 140),
    -- Metabolic
    ('TTGO',               N'Test toleranta glucoza orala',  'Metabolic',   'Functional', 'Structured',    'Diabetology',                      1, 1, 150),
    -- Chestionare
    ('Epworth',            N'Scor Epworth (ESS)',            'Sleep',       'Functional', 'Questionnaire', 'Pneumology',                       1, 1, 200),
    ('STOP_BANG',          N'Chestionar STOP-BANG',          'Sleep',       'Functional', 'Questionnaire', 'Pneumology',                       1, 1, 210),
    ('CAT',                N'COPD Assessment Test (CAT)',    'Respiratory', 'Functional', 'Questionnaire', 'Pneumology',                       1, 1, 220),
    ('mMRC',               N'Scala dispnee mMRC',            'Respiratory', 'Functional', 'Questionnaire', 'Pneumology',                       1, 1, 230),
    -- Imagistica
    ('XRay_Chest',         N'Radiografie toracica',          'Imaging',     'Imaging',    'Narrative',     'Pneumology,Cardiology',            0, 0, 300),
    ('CT_Chest',           N'CT torace',                     'Imaging',     'Imaging',    'Narrative',     'Pneumology,Cardiology',            0, 0, 310),
    ('CT_Cardiac',         N'CT cardiac',                    'Imaging',     'Imaging',    'Narrative',     'Cardiology',                       0, 0, 320),
    ('MRI',                N'RMN',                           'Imaging',     'Imaging',    'Narrative',     'Pneumology,Cardiology',            0, 0, 330),
    ('Ultrasound',         N'Ecografie',                     'Imaging',     'Imaging',    'Narrative',     'Pneumology,Cardiology,Diabetology',0, 0, 340),
    ('DopplerUS',          N'Ecografie Doppler vascular',    'Imaging',     'Imaging',    'Narrative',     'Cardiology,Diabetology',           0, 0, 350),
    ('Mammography',        N'Mamografie',                    'Imaging',     'Imaging',    'Narrative',     'Pneumology',                       0, 0, 360),
    ('DEXA',               N'Densitometrie osoasa (DEXA)',   'Imaging',     'Imaging',    'Narrative',     'Diabetology',                      0, 0, 370),
    ('FundusExam',         N'Examen fund de ochi',           'Imaging',     'Imaging',    'Narrative',     'Diabetology',                      0, 0, 380),
    -- Proceduri
    ('Bronchoscopy',       N'Bronhoscopie',                  'Procedure',   'Procedures', 'Narrative',     'Pneumology',                       0, 0, 400),
    ('Biopsy',             N'Biopsie',                       'Procedure',   'Procedures', 'Narrative',     'Pneumology',                       0, 0, 410),
    ('Coronarography',     N'Coronarografie',                'Procedure',   'Procedures', 'Narrative',     'Cardiology',                       0, 0, 420),
    ('EMG_NCV',            N'EMG / Viteze conducere nervoasa','Procedure',  'Procedures', 'Narrative',     'Diabetology',                      0, 0, 430),
    ('ABI',                N'Indice glezna-brat (ABI)',      'Procedure',   'Procedures', 'Narrative',     'Cardiology,Diabetology',           0, 0, 440)
) AS s (TypeCode, DisplayName, Category, ParentTab, UIPattern, Specialties, HasStructuredFields, DefaultStructuredEntry, SortOrder)
ON t.TypeCode = s.TypeCode
WHEN MATCHED THEN UPDATE SET
    DisplayName            = s.DisplayName,
    Category               = s.Category,
    ParentTab              = s.ParentTab,
    UIPattern              = s.UIPattern,
    Specialties            = s.Specialties,
    HasStructuredFields    = s.HasStructuredFields,
    DefaultStructuredEntry = s.DefaultStructuredEntry,
    SortOrder              = s.SortOrder
WHEN NOT MATCHED THEN INSERT
    (TypeCode, DisplayName, Category, ParentTab, UIPattern, Specialties, HasStructuredFields, DefaultStructuredEntry, SortOrder)
    VALUES
    (s.TypeCode, s.DisplayName, s.Category, s.ParentTab, s.UIPattern, s.Specialties, s.HasStructuredFields, s.DefaultStructuredEntry, s.SortOrder);

PRINT 'Seed InvestigationTypeDefinitions sincronizat.';
GO

PRINT 'Migrarea 0036 finalizata cu succes.';
GO
