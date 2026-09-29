-- ============================================================================
-- Migrare 0064: InvestigationTypeDefinitions — cheie primară GUID
--   1. Id UNIQUEIDENTIFIER devine PK (GUID-uri fixe pentru tipurile din seed, ca să fie
--      identice în toate mediile); TypeCode rămâne cheie unică (cod de business).
--   2. ConsultationInvestigations.InvestigationType rămâne legat de TypeCode (prin UQ).
--   3. MedicalServices.InvestigationTypeId → InvestigationTypeDefinitions.Id înlocuiește
--      InvestigationTypeCode; un singur serviciu per investigație în clinică (1:1).
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

IF COL_LENGTH('dbo.InvestigationTypeDefinitions', 'Id') IS NULL
    ALTER TABLE dbo.InvestigationTypeDefinitions ADD Id UNIQUEIDENTIFIER NULL;
GO

UPDATE d
SET Id = m.Id
FROM dbo.InvestigationTypeDefinitions d
INNER JOIN (VALUES
    (N'Spirometry',       'F7000000-0000-0000-0000-000000000001'),
    (N'DLCO',             'F7000000-0000-0000-0000-000000000002'),
    (N'ABG',              'F7000000-0000-0000-0000-000000000003'),
    (N'Oximetry',         'F7000000-0000-0000-0000-000000000004'),
    (N'SixMWT',           'F7000000-0000-0000-0000-000000000005'),
    (N'ECG',              'F7000000-0000-0000-0000-000000000006'),
    (N'Echocardiography', 'F7000000-0000-0000-0000-000000000007'),
    (N'Holter_ECG',       'F7000000-0000-0000-0000-000000000008'),
    (N'Holter_BP',        'F7000000-0000-0000-0000-000000000009'),
    (N'StressTest',       'F7000000-0000-0000-0000-00000000000A'),
    (N'PSG_Diagnostic',   'F7000000-0000-0000-0000-00000000000B'),
    (N'PSG_SplitNight',   'F7000000-0000-0000-0000-00000000000C'),
    (N'CPAP_Titration',   'F7000000-0000-0000-0000-00000000000D'),
    (N'CPAP_FollowUp',    'F7000000-0000-0000-0000-00000000000E'),
    (N'TTGO',             'F7000000-0000-0000-0000-00000000000F'),
    (N'Epworth',          'F7000000-0000-0000-0000-000000000010'),
    (N'STOP_BANG',        'F7000000-0000-0000-0000-000000000011'),
    (N'CAT',              'F7000000-0000-0000-0000-000000000012'),
    (N'mMRC',             'F7000000-0000-0000-0000-000000000013'),
    (N'XRay_Chest',       'F7000000-0000-0000-0000-000000000014'),
    (N'CT_Chest',         'F7000000-0000-0000-0000-000000000015'),
    (N'CT_Cardiac',       'F7000000-0000-0000-0000-000000000016'),
    (N'MRI',              'F7000000-0000-0000-0000-000000000017'),
    (N'Ultrasound',       'F7000000-0000-0000-0000-000000000018'),
    (N'DopplerUS',        'F7000000-0000-0000-0000-000000000019'),
    (N'Mammography',      'F7000000-0000-0000-0000-00000000001A'),
    (N'DEXA',             'F7000000-0000-0000-0000-00000000001B'),
    (N'FundusExam',       'F7000000-0000-0000-0000-00000000001C'),
    (N'LabResults',       'F7000000-0000-0000-0000-00000000001D'),
    (N'Bronchoscopy',     'F7000000-0000-0000-0000-00000000001E'),
    (N'Biopsy',           'F7000000-0000-0000-0000-00000000001F'),
    (N'Coronarography',   'F7000000-0000-0000-0000-000000000020'),
    (N'EMG_NCV',          'F7000000-0000-0000-0000-000000000021'),
    (N'ABI',              'F7000000-0000-0000-0000-000000000022')
) AS m (TypeCode, Id) ON m.TypeCode = d.TypeCode
WHERE d.Id IS NULL;

UPDATE dbo.InvestigationTypeDefinitions SET Id = NEWID() WHERE Id IS NULL;
GO

IF EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.InvestigationTypeDefinitions')
           AND name = 'Id' AND is_nullable = 1)
BEGIN
    ALTER TABLE dbo.InvestigationTypeDefinitions ALTER COLUMN Id UNIQUEIDENTIFIER NOT NULL;
    ALTER TABLE dbo.InvestigationTypeDefinitions
        ADD CONSTRAINT DF_InvestigationTypeDefinitions_Id DEFAULT NEWSEQUENTIALID() FOR Id;
END;
GO

-- Cheile externe pe TypeCode trebuie scoase înainte de schimbarea PK-ului
IF OBJECT_ID('dbo.FK_ConsInv_Type', 'F') IS NOT NULL
    ALTER TABLE dbo.ConsultationInvestigations DROP CONSTRAINT FK_ConsInv_Type;
IF OBJECT_ID('dbo.FK_MedicalServices_InvestigationTypes', 'F') IS NOT NULL
    ALTER TABLE dbo.MedicalServices DROP CONSTRAINT FK_MedicalServices_InvestigationTypes;
GO

IF EXISTS (SELECT 1 FROM sys.key_constraints kc
           INNER JOIN sys.index_columns ic ON ic.object_id = kc.parent_object_id AND ic.index_id = kc.unique_index_id
           INNER JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
           WHERE kc.name = 'PK_InvestigationTypeDefinitions' AND c.name = 'TypeCode')
BEGIN
    ALTER TABLE dbo.InvestigationTypeDefinitions DROP CONSTRAINT PK_InvestigationTypeDefinitions;
    ALTER TABLE dbo.InvestigationTypeDefinitions ADD CONSTRAINT PK_InvestigationTypeDefinitions PRIMARY KEY (Id);
    ALTER TABLE dbo.InvestigationTypeDefinitions ADD CONSTRAINT UQ_InvestigationTypeDefinitions_TypeCode UNIQUE (TypeCode);
    PRINT 'InvestigationTypeDefinitions: PK mutat pe Id, TypeCode unic.';
END;
GO

ALTER TABLE dbo.ConsultationInvestigations
    ADD CONSTRAINT FK_ConsInv_Type FOREIGN KEY (InvestigationType)
        REFERENCES dbo.InvestigationTypeDefinitions (TypeCode);
GO

IF COL_LENGTH('dbo.MedicalServices', 'InvestigationTypeId') IS NULL
    ALTER TABLE dbo.MedicalServices ADD InvestigationTypeId UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH('dbo.MedicalServices', 'InvestigationTypeCode') IS NOT NULL
BEGIN
    EXEC (N'UPDATE ms SET InvestigationTypeId = d.Id
            FROM dbo.MedicalServices ms
            INNER JOIN dbo.InvestigationTypeDefinitions d ON d.TypeCode = ms.InvestigationTypeCode
            WHERE ms.InvestigationTypeId IS NULL;');

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_MedicalServices_Clinic_InvestigationType')
        DROP INDEX UX_MedicalServices_Clinic_InvestigationType ON dbo.MedicalServices;

    ALTER TABLE dbo.MedicalServices DROP COLUMN InvestigationTypeCode;
    PRINT 'MedicalServices: InvestigationTypeCode înlocuit de InvestigationTypeId.';
END;
GO

IF OBJECT_ID('dbo.FK_MedicalServices_InvestigationTypes', 'F') IS NULL
    ALTER TABLE dbo.MedicalServices
        ADD CONSTRAINT FK_MedicalServices_InvestigationTypes FOREIGN KEY (InvestigationTypeId)
            REFERENCES dbo.InvestigationTypeDefinitions (Id);
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_MedicalServices_Clinic_InvestigationType')
    CREATE UNIQUE NONCLUSTERED INDEX UX_MedicalServices_Clinic_InvestigationType
        ON dbo.MedicalServices (ClinicId, InvestigationTypeId)
        WHERE IsDeleted = 0 AND InvestigationTypeId IS NOT NULL;
GO

PRINT 'Migrarea 0064_InvestigationTypesGuidKey finalizata cu succes.';
GO
