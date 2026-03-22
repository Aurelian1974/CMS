-- =============================================================================
-- Migrare 0026: Tabele nomenclator CNAS (medicamente, compensate, diagnostice)
-- Sursă: NomenclatoareFarmacii + NomenclatoareFarmaciiLista (SIUI)
-- =============================================================================

-- ── NomenclatorSyncLog ────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'NomenclatorSyncLog')
BEGIN
    CREATE TABLE dbo.NomenclatorSyncLog (
        Id                  UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        StartedAt           DATETIME2        NOT NULL DEFAULT GETDATE(),
        FinishedAt          DATETIME2        NULL,
        NomenclatorVersion  NVARCHAR(30)     NULL,   -- issueDate din XML (ex: '2026-02-27T12:07:28')
        UrlNomenclator      NVARCHAR(500)    NULL,
        UrlLista            NVARCHAR(500)    NULL,
        Status              NVARCHAR(20)     NOT NULL DEFAULT 'Running',
            -- Running | Success | Failed
        ErrorMessage        NVARCHAR(2000)   NULL,
        DrugsInserted       INT              NULL,
        DrugsUpdated        INT              NULL,
        CompensatedInserted INT              NULL,
        CompensatedUpdated  INT              NULL,
        ActiveSubstsInserted INT             NULL,
        DurationSeconds     INT              NULL,
        TriggeredBy         NVARCHAR(100)    NULL,   -- 'manual:{username}' sau 'scheduler'
        CONSTRAINT CK_SyncLog_Status CHECK (Status IN ('Running','Success','Failed'))
    );
    PRINT 'Tabel NomenclatorSyncLog creat.';
END;
GO

-- ── Cnas_PrescriptionType ─────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Cnas_PrescriptionType')
BEGIN
    CREATE TABLE dbo.Cnas_PrescriptionType (
        Code            NVARCHAR(10)    NOT NULL PRIMARY KEY,
        Description     NVARCHAR(200)   NOT NULL,
        ForNarcotics    BIT             NOT NULL DEFAULT 0,
        ValidFrom       DATE            NULL,
        SyncedAt        DATETIME2       NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabel Cnas_PrescriptionType creat.';
END;
GO

-- ── Cnas_NHP (Programe Naționale de Sănătate) ─────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Cnas_NHP')
BEGIN
    CREATE TABLE dbo.Cnas_NHP (
        Code                    NVARCHAR(30)    NOT NULL PRIMARY KEY,
        Description             NVARCHAR(500)   NOT NULL,
        ProgramCode             NVARCHAR(50)    NULL,
        HasAmbulatoryBudget     BIT             NOT NULL DEFAULT 0,
        HasHospitalBudget       BIT             NOT NULL DEFAULT 0,
        HasDrugsBudget          BIT             NOT NULL DEFAULT 0,
        HasGoodsBudget          BIT             NOT NULL DEFAULT 0,
        ValidFrom               DATE            NULL,
        ValidTo                 DATE            NULL,
        IsActive                BIT             NOT NULL DEFAULT 1,
        SyncedAt                DATETIME2       NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabel Cnas_NHP creat.';
END;
GO

-- ── Cnas_DiseaseCategory ──────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Cnas_DiseaseCategory')
BEGIN
    CREATE TABLE dbo.Cnas_DiseaseCategory (
        Code                NVARCHAR(20)    NOT NULL PRIMARY KEY,
        Description         NVARCHAR(300)   NOT NULL,
        IsChronicDisease    BIT             NOT NULL DEFAULT 0,
        IsAuctioned         BIT             NOT NULL DEFAULT 0,
        ValidFrom           DATE            NULL,
        SyncedAt            DATETIME2       NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabel Cnas_DiseaseCategory creat.';
END;
GO

-- ── Cnas_ICD10 (subset CNAS utilizat în compensări) ──────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Cnas_ICD10')
BEGIN
    CREATE TABLE dbo.Cnas_ICD10 (
        Code                NVARCHAR(20)    NOT NULL PRIMARY KEY,
        Name                NVARCHAR(500)   NOT NULL,
        DiseaseCategoryCode NVARCHAR(20)    NULL,
        ValidFrom           DATE            NULL,
        ValidTo             DATE            NULL,
        IsActive            BIT             NOT NULL DEFAULT 1,
        SyncedAt            DATETIME2       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_ICD10_DiseaseCategory
            FOREIGN KEY (DiseaseCategoryCode) REFERENCES dbo.Cnas_DiseaseCategory(Code)
    );
    PRINT 'Tabel Cnas_ICD10 creat.';
END;
GO

-- ── Cnas_Cim10 (clasificare CIM-10 completă, arbore ierarhic) ────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Cnas_Cim10')
BEGIN
    CREATE TABLE dbo.Cnas_Cim10 (
        Code            NVARCHAR(20)    NOT NULL PRIMARY KEY,
        Name            NVARCHAR(500)   NOT NULL,
        EntityLevel     NVARCHAR(10)    NULL,   -- ex: 'chapter', 'block', 'category'
        ParentCode      NVARCHAR(20)    NULL,
        SyncedAt        DATETIME2       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_Cim10_Parent
            FOREIGN KEY (ParentCode) REFERENCES dbo.Cnas_Cim10(Code)
    );
    CREATE INDEX IX_Cim10_ParentCode ON dbo.Cnas_Cim10 (ParentCode);
    PRINT 'Tabel Cnas_Cim10 creat.';
END;
GO

-- ── Cnas_ATC (clasificare ATC, arbore ierarhic) ───────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Cnas_ATC')
BEGIN
    CREATE TABLE dbo.Cnas_ATC (
        Code            NVARCHAR(20)    NOT NULL PRIMARY KEY,
        Description     NVARCHAR(500)   NULL,
        ParentATC       NVARCHAR(20)    NULL,
        ValidFrom       DATE            NULL,
        SyncedAt        DATETIME2       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_ATC_Parent
            FOREIGN KEY (ParentATC) REFERENCES dbo.Cnas_ATC(Code)
    );
    CREATE INDEX IX_ATC_ParentATC ON dbo.Cnas_ATC (ParentATC);
    PRINT 'Tabel Cnas_ATC creat.';
END;
GO

-- ── Cnas_ActiveSubstance ──────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Cnas_ActiveSubstance')
BEGIN
    CREATE TABLE dbo.Cnas_ActiveSubstance (
        Code        NVARCHAR(200)   NOT NULL PRIMARY KEY,
        ValidFrom   DATE            NULL,
        SyncedAt    DATETIME2       NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabel Cnas_ActiveSubstance creat.';
END;
GO

-- ── Cnas_Drug (catalogul complet de medicamente) ─────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Cnas_Drug')
BEGIN
    CREATE TABLE dbo.Cnas_Drug (
        Code                        NVARCHAR(50)    NOT NULL PRIMARY KEY,
        Name                        NVARCHAR(500)   NOT NULL,
        PresentationMode            NVARCHAR(1000)  NULL,
        IsNarcotic                  BIT             NOT NULL DEFAULT 0,
        IsFractional                BIT             NOT NULL DEFAULT 0,
        IsSpecial                   BIT             NOT NULL DEFAULT 0,
        IsBrand                     BIT             NOT NULL DEFAULT 0,
        HasBioEchiv                 BIT             NOT NULL DEFAULT 0,
        QtyPerPackage               INT             NULL,
        PricePerPackage             DECIMAL(18,4)   NULL,
        WholeSalePricePerPackage    DECIMAL(18,4)   NULL,
        PrescriptionMode            NVARCHAR(50)    NULL,   -- OTC, PRF, P-RF, etc.
        ValidFrom                   DATE            NULL,
        ValidTo                     DATE            NULL,
        ActiveSubstanceCode         NVARCHAR(200)   NULL,
        Concentration               NVARCHAR(200)   NULL,
        PharmaceuticalForm          NVARCHAR(200)   NULL,
        Company                     NVARCHAR(500)   NULL,
        CountryCode                 NVARCHAR(20)    NULL,
        AtcCode                     NVARCHAR(20)    NULL,
        IsActive                    BIT             NOT NULL DEFAULT 1,
        SyncedAt                    DATETIME2       NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_Drug_Name           ON dbo.Cnas_Drug (Name);
    CREATE INDEX IX_Drug_AtcCode        ON dbo.Cnas_Drug (AtcCode);
    CREATE INDEX IX_Drug_ActiveSubst    ON dbo.Cnas_Drug (ActiveSubstanceCode);
    CREATE INDEX IX_Drug_IsActive       ON dbo.Cnas_Drug (IsActive);
    PRINT 'Tabel Cnas_Drug creat.';
END;
GO

-- ── Cnas_CopaymentListType ────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Cnas_CopaymentListType')
BEGIN
    CREATE TABLE dbo.Cnas_CopaymentListType (
        Code            NVARCHAR(20)    NOT NULL PRIMARY KEY,
        Description     NVARCHAR(300)   NULL,
        CopaymentPercent DECIMAL(5,2)   NULL,
        DrugMaxNo       INT             NULL,
        MaxValue        DECIMAL(18,4)   NULL,
        ValidFrom       DATE            NULL,
        ValidTo         DATE            NULL,
        IsActive        BIT             NOT NULL DEFAULT 1,
        SyncedAt        DATETIME2       NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabel Cnas_CopaymentListType creat.';
END;
GO

-- ── Cnas_CopaymentListDrug (lista compensatelor per medicament) ───────────────
-- Cheia naturală: (CopaymentListType, DrugCode, ValidFrom)
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Cnas_CopaymentListDrug')
BEGIN
    CREATE TABLE dbo.Cnas_CopaymentListDrug (
        Id                      INT             NOT NULL IDENTITY(1,1) PRIMARY KEY,
        CopaymentListType       NVARCHAR(20)    NOT NULL,
        DrugCode                NVARCHAR(50)    NOT NULL,
        NhpCode                 NVARCHAR(30)    NULL,
        DiseaseCode             NVARCHAR(20)    NULL,
        MaxPrice                DECIMAL(18,4)   NULL,
        MaxPriceUT              DECIMAL(18,4)   NULL,
        CopaymentValue          DECIMAL(18,4)   NULL,
        CopaymentValue90        DECIMAL(18,4)   NULL,
        WholeSalePrice          DECIMAL(18,4)   NULL,
        ReferencePrice          DECIMAL(18,4)   NULL,
        SpecialLaw              NVARCHAR(100)   NULL,
        NeedApproval            BIT             NOT NULL DEFAULT 0,
        ContractCv              BIT             NOT NULL DEFAULT 0,
        OverValue               BIT             NOT NULL DEFAULT 0,
        NeedSpecialty           BIT             NOT NULL DEFAULT 0,
        ClassifInsulin          NVARCHAR(50)    NULL,
        HgDci                   NVARCHAR(200)   NULL,
        HgAtc                   NVARCHAR(20)    NULL,
        HgIcd10                 NVARCHAR(20)    NULL,
        OpenCircuit             BIT             NOT NULL DEFAULT 0,
        ValidFrom               DATE            NULL,
        ValidTo                 DATE            NULL,
        IsActive                BIT             NOT NULL DEFAULT 1,
        SyncedAt                DATETIME2       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT FK_CLD_Drug
            FOREIGN KEY (DrugCode) REFERENCES dbo.Cnas_Drug(Code)
    );
    CREATE INDEX IX_CLD_DrugCode   ON dbo.Cnas_CopaymentListDrug (DrugCode);
    CREATE INDEX IX_CLD_ListType   ON dbo.Cnas_CopaymentListDrug (CopaymentListType);
    CREATE INDEX IX_CLD_NhpCode    ON dbo.Cnas_CopaymentListDrug (NhpCode);
    CREATE INDEX IX_CLD_IsActive   ON dbo.Cnas_CopaymentListDrug (IsActive);
    PRINT 'Tabel Cnas_CopaymentListDrug creat.';
END;
GO

-- ── Cnas_CopaymentListActiveSubst ─────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Cnas_CopaymentListActiveSubst')
BEGIN
    CREATE TABLE dbo.Cnas_CopaymentListActiveSubst (
        Id                      INT             NOT NULL IDENTITY(1,1) PRIMARY KEY,
        CopaymentListType       NVARCHAR(20)    NOT NULL,
        ActiveSubstanceCode     NVARCHAR(200)   NOT NULL,
        AtcCode                 NVARCHAR(20)    NULL,
        NhpCode                 NVARCHAR(30)    NULL,
        DiseaseCategoryCode     NVARCHAR(20)    NULL,
        Icd10                   NVARCHAR(20)    NULL,
        NeedApproval            BIT             NOT NULL DEFAULT 0,
        OpenCircuit             BIT             NOT NULL DEFAULT 0,
        ContractCv              BIT             NOT NULL DEFAULT 0,
        ValidFrom               DATE            NULL,
        ValidTo                 DATE            NULL,
        IsActive                BIT             NOT NULL DEFAULT 1,
        SyncedAt                DATETIME2       NOT NULL DEFAULT GETDATE()
    );
    CREATE INDEX IX_CLAS_ActiveSubst ON dbo.Cnas_CopaymentListActiveSubst (ActiveSubstanceCode);
    CREATE INDEX IX_CLAS_IsActive    ON dbo.Cnas_CopaymentListActiveSubst (IsActive);
    PRINT 'Tabel Cnas_CopaymentListActiveSubst creat.';
END;
GO

PRINT 'Migrarea 0026_CreateCnasNomenclator finalizata cu succes.';
GO
