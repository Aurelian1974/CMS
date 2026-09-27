-- ============================================================================
-- Migrare 0056: Bonuri fiscale (casa de marcat Datecs, prin fiscal bridge local)
--   FiscalReceiptStatuses, FiscalReceipts (1 bon per plată), FiscalReceiptLines,
--   FiscalReceiptEvents (istoric tranziții), FiscalSettings, mapări TVA / plăți.
-- Mașina de stări: PENDING → PRINTING → PRINTED | FAILED | UNKNOWN;
--   UNKNOWN → (reconciliere manuală) PRINTED | FAILED; FAILED → PRINTING (reluare
--   manuală) | CANCELLED. Niciodată un bon nou automat.
-- Rollback: Scripts/Rollback/0056_Rollback_CreateFiscalReceipts.sql
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ── FiscalReceiptStatuses ────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'FiscalReceiptStatuses')
BEGIN
    CREATE TABLE dbo.FiscalReceiptStatuses (
        Id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_FiscalReceiptStatuses_Id DEFAULT NEWSEQUENTIALID(),
        Code      NVARCHAR(30)     NOT NULL,
        Name      NVARCHAR(100)    NOT NULL,
        SortOrder INT              NOT NULL CONSTRAINT DF_FiscalReceiptStatuses_SortOrder DEFAULT 0,
        IsActive  BIT              NOT NULL CONSTRAINT DF_FiscalReceiptStatuses_IsActive DEFAULT 1,
        CONSTRAINT PK_FiscalReceiptStatuses PRIMARY KEY (Id),
        CONSTRAINT UQ_FiscalReceiptStatuses_Code UNIQUE (Code)
    );

    INSERT INTO dbo.FiscalReceiptStatuses (Id, Code, Name, SortOrder) VALUES
        ('F5000000-0000-0000-0000-000000000001', N'PENDING',   N'În așteptare', 1),
        ('F5000000-0000-0000-0000-000000000002', N'PRINTING',  N'În tipărire',  2),
        ('F5000000-0000-0000-0000-000000000003', N'PRINTED',   N'Emis',         3),
        ('F5000000-0000-0000-0000-000000000004', N'FAILED',    N'Eșuat',        4),
        ('F5000000-0000-0000-0000-000000000005', N'UNKNOWN',   N'Necunoscut',   5),
        ('F5000000-0000-0000-0000-000000000006', N'CANCELLED', N'Anulat',       6);

    PRINT 'Tabel FiscalReceiptStatuses creat + seed.';
END
GO

-- ── FiscalReceipts ───────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'FiscalReceipts')
BEGIN
    CREATE TABLE dbo.FiscalReceipts (
        Id                 UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_FiscalReceipts_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId           UNIQUEIDENTIFIER NOT NULL,
        ConsultationId     UNIQUEIDENTIFIER NOT NULL,
        PaymentId          UNIQUEIDENTIFIER NOT NULL,
        StatusId           UNIQUEIDENTIFIER NOT NULL,
        Amount             DECIMAL(18,2)    NOT NULL,
        ReceiptNumber      NVARCHAR(30)     NULL,
        DeviceSerialNumber NVARCHAR(30)     NULL,
        PrintedAt          DATETIME2(0)     NULL,
        AttemptCount       INT              NOT NULL CONSTRAINT DF_FiscalReceipts_AttemptCount DEFAULT 0,
        LastError          NVARCHAR(1000)   NULL,
        -- Răspunsul brut al aparatului (fără date personale)
        DeviceResponse     NVARCHAR(MAX)    NULL,
        IsManuallyReconciled BIT            NOT NULL CONSTRAINT DF_FiscalReceipts_Reconciled DEFAULT 0,
        ReconciliationNote NVARCHAR(500)    NULL,
        ReconciledAt       DATETIME2(0)     NULL,
        ReconciledBy       UNIQUEIDENTIFIER NULL,
        RowVersion         ROWVERSION       NOT NULL,
        CreatedAt          DATETIME2(0)     NOT NULL CONSTRAINT DF_FiscalReceipts_CreatedAt DEFAULT GETDATE(),
        CreatedBy          UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt          DATETIME2(0)     NULL,
        UpdatedBy          UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_FiscalReceipts PRIMARY KEY (Id),
        CONSTRAINT FK_FiscalReceipts_Clinics       FOREIGN KEY (ClinicId)       REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_FiscalReceipts_Consultations FOREIGN KEY (ConsultationId) REFERENCES dbo.Consultations(Id),
        CONSTRAINT FK_FiscalReceipts_Payments      FOREIGN KEY (PaymentId)      REFERENCES dbo.Payments(Id),
        CONSTRAINT FK_FiscalReceipts_Statuses      FOREIGN KEY (StatusId)       REFERENCES dbo.FiscalReceiptStatuses(Id),
        -- Un bon per plată — idempotență la nivel de BD
        CONSTRAINT UQ_FiscalReceipts_Payment       UNIQUE (PaymentId),
        CONSTRAINT CK_FiscalReceipts_Amount        CHECK (Amount > 0)
    );

    CREATE NONCLUSTERED INDEX IX_FiscalReceipts_Consultation
        ON dbo.FiscalReceipts (ConsultationId) INCLUDE (StatusId, Amount, ReceiptNumber);

    CREATE NONCLUSTERED INDEX IX_FiscalReceipts_Clinic_Status
        ON dbo.FiscalReceipts (ClinicId, StatusId) INCLUDE (CreatedAt);

    PRINT 'Tabel FiscalReceipts creat.';
END
GO

-- ── FiscalReceiptLines ───────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'FiscalReceiptLines')
BEGIN
    CREATE TABLE dbo.FiscalReceiptLines (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_FiscalReceiptLines_Id DEFAULT NEWSEQUENTIALID(),
        FiscalReceiptId UNIQUEIDENTIFIER NOT NULL,
        Name            NVARCHAR(200)    NOT NULL,
        UnitPrice       DECIMAL(18,2)    NOT NULL,
        Quantity        DECIMAL(10,3)    NOT NULL,
        LineTotal       DECIMAL(18,2)    NOT NULL,
        VatRateId       UNIQUEIDENTIFIER NOT NULL,
        -- Grupa de TVA programată în aparat (snapshot din FiscalVatMappings)
        TaxGroup        NVARCHAR(5)      NOT NULL,
        SortOrder       INT              NOT NULL CONSTRAINT DF_FiscalReceiptLines_SortOrder DEFAULT 0,
        CONSTRAINT PK_FiscalReceiptLines PRIMARY KEY (Id),
        CONSTRAINT FK_FiscalReceiptLines_Receipts FOREIGN KEY (FiscalReceiptId) REFERENCES dbo.FiscalReceipts(Id),
        CONSTRAINT FK_FiscalReceiptLines_VatRates FOREIGN KEY (VatRateId)       REFERENCES dbo.VatRates(Id)
    );

    CREATE NONCLUSTERED INDEX IX_FiscalReceiptLines_Receipt ON dbo.FiscalReceiptLines (FiscalReceiptId, SortOrder);

    PRINT 'Tabel FiscalReceiptLines creat.';
END
GO

-- ── FiscalReceiptEvents (audit al tranzițiilor și al răspunsurilor aparatului) ─
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'FiscalReceiptEvents')
BEGIN
    CREATE TABLE dbo.FiscalReceiptEvents (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_FiscalReceiptEvents_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId        UNIQUEIDENTIFIER NOT NULL,
        FiscalReceiptId UNIQUEIDENTIFIER NOT NULL,
        FromStatusId    UNIQUEIDENTIFIER NULL,
        ToStatusId      UNIQUEIDENTIFIER NOT NULL,
        Message         NVARCHAR(1000)   NULL,
        DeviceResponse  NVARCHAR(MAX)    NULL,
        CreatedAt       DATETIME2(0)     NOT NULL CONSTRAINT DF_FiscalReceiptEvents_CreatedAt DEFAULT GETDATE(),
        CreatedBy       UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_FiscalReceiptEvents PRIMARY KEY (Id),
        CONSTRAINT FK_FiscalReceiptEvents_Receipts FOREIGN KEY (FiscalReceiptId) REFERENCES dbo.FiscalReceipts(Id)
    );

    CREATE NONCLUSTERED INDEX IX_FiscalReceiptEvents_Receipt ON dbo.FiscalReceiptEvents (FiscalReceiptId, CreatedAt);

    PRINT 'Tabel FiscalReceiptEvents creat.';
END
GO

-- ── FiscalSettings (per clinică) ─────────────────────────────────────────────
-- Portul COM, viteza și parola operatorului stau în configurația bridge-ului de pe PC-ul
-- de recepție, nu aici: secretele aparatului nu ajung în BD centrală.
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'FiscalSettings')
BEGIN
    CREATE TABLE dbo.FiscalSettings (
        ClinicId    UNIQUEIDENTIFIER NOT NULL,
        IsEnabled   BIT              NOT NULL CONSTRAINT DF_FiscalSettings_IsEnabled DEFAULT 1,
        BridgeUrl   NVARCHAR(200)    NOT NULL CONSTRAINT DF_FiscalSettings_BridgeUrl DEFAULT N'http://127.0.0.1:5199',
        UpdatedAt   DATETIME2(0)     NULL,
        UpdatedBy   UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_FiscalSettings PRIMARY KEY (ClinicId),
        CONSTRAINT FK_FiscalSettings_Clinics FOREIGN KEY (ClinicId) REFERENCES dbo.Clinics(Id)
    );

    PRINT 'Tabel FiscalSettings creat.';
END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'FiscalVatMappings')
BEGIN
    CREATE TABLE dbo.FiscalVatMappings (
        Id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_FiscalVatMappings_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId  UNIQUEIDENTIFIER NOT NULL,
        VatRateId UNIQUEIDENTIFIER NOT NULL,
        -- Grupa TVA exact cum e programată în aparat de service-ul autorizat
        TaxGroup  NVARCHAR(5)      NOT NULL,
        CONSTRAINT PK_FiscalVatMappings PRIMARY KEY (Id),
        CONSTRAINT FK_FiscalVatMappings_Clinics  FOREIGN KEY (ClinicId)  REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_FiscalVatMappings_VatRates FOREIGN KEY (VatRateId) REFERENCES dbo.VatRates(Id),
        CONSTRAINT UQ_FiscalVatMappings UNIQUE (ClinicId, VatRateId)
    );

    PRINT 'Tabel FiscalVatMappings creat.';
END
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'FiscalPaymentMappings')
BEGIN
    CREATE TABLE dbo.FiscalPaymentMappings (
        Id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_FiscalPaymentMappings_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId          UNIQUEIDENTIFIER NOT NULL,
        PaymentMethodId   UNIQUEIDENTIFIER NOT NULL,
        -- Codul tipului de plată acceptat de aparat (conform manualului modelului)
        DevicePaymentCode NVARCHAR(5)      NOT NULL,
        CONSTRAINT PK_FiscalPaymentMappings PRIMARY KEY (Id),
        CONSTRAINT FK_FiscalPaymentMappings_Clinics FOREIGN KEY (ClinicId)        REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_FiscalPaymentMappings_Methods FOREIGN KEY (PaymentMethodId) REFERENCES dbo.PaymentMethods(Id),
        CONSTRAINT UQ_FiscalPaymentMappings UNIQUE (ClinicId, PaymentMethodId)
    );

    PRINT 'Tabel FiscalPaymentMappings creat.';
END
GO

-- ── Table types pentru salvarea mapărilor ────────────────────────────────────
IF TYPE_ID('dbo.FiscalVatMappingTableType') IS NULL
    CREATE TYPE dbo.FiscalVatMappingTableType AS TABLE (
        VatRateId UNIQUEIDENTIFIER NOT NULL,
        TaxGroup  NVARCHAR(5)      NOT NULL
    );
GO

IF TYPE_ID('dbo.FiscalPaymentMappingTableType') IS NULL
    CREATE TYPE dbo.FiscalPaymentMappingTableType AS TABLE (
        PaymentMethodId   UNIQUEIDENTIFIER NOT NULL,
        DevicePaymentCode NVARCHAR(5)      NOT NULL
    );
GO

PRINT 'Migrarea 0056_CreateFiscalReceipts finalizata cu succes.';
GO
