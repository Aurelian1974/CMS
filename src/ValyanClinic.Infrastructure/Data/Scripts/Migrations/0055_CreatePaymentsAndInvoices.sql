-- ============================================================================
-- Migrare 0055: Plăți și facturi
--   PaymentMethods, Payments, PaymentTenders (plată mixtă), InvoiceStatuses,
--   InvoiceSeries (contor fără goluri), Invoices, InvoiceLines, table types.
-- Documentele fiscale NU au soft delete: corecția se face exclusiv prin storno.
-- Idempotență: UNIQUE (ClinicId, IdempotencyKey) pe plăți și facturi.
-- Model pregătit pentru e-Factura (UBL / CIUS-RO), fără transmitere.
-- Rollback: Scripts/Rollback/0055_Rollback_CreatePaymentsAndInvoices.sql
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ── PaymentMethods ───────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PaymentMethods')
BEGIN
    CREATE TABLE dbo.PaymentMethods (
        Id                    UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_PaymentMethods_Id DEFAULT NEWSEQUENTIALID(),
        Code                  NVARCHAR(30)     NOT NULL,
        Name                  NVARCHAR(100)    NOT NULL,
        -- 1 = încasarea se face cu bon fiscal (numerar / card)
        RequiresFiscalReceipt BIT              NOT NULL,
        SortOrder             INT              NOT NULL CONSTRAINT DF_PaymentMethods_SortOrder DEFAULT 0,
        IsActive              BIT              NOT NULL CONSTRAINT DF_PaymentMethods_IsActive DEFAULT 1,
        CONSTRAINT PK_PaymentMethods PRIMARY KEY (Id),
        CONSTRAINT UQ_PaymentMethods_Code UNIQUE (Code)
    );

    INSERT INTO dbo.PaymentMethods (Id, Code, Name, RequiresFiscalReceipt, SortOrder) VALUES
        ('F3000000-0000-0000-0000-000000000001', N'NUMERAR',  N'Numerar',          1, 1),
        ('F3000000-0000-0000-0000-000000000002', N'CARD',     N'Card',             1, 2),
        ('F3000000-0000-0000-0000-000000000003', N'TRANSFER', N'Transfer bancar',  0, 3);

    PRINT 'Tabel PaymentMethods creat + seed.';
END
GO

-- ── Payments ─────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Payments')
BEGIN
    CREATE TABLE dbo.Payments (
        Id             UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Payments_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId       UNIQUEIDENTIFIER NOT NULL,
        ConsultationId UNIQUEIDENTIFIER NOT NULL,
        PatientId      UNIQUEIDENTIFIER NOT NULL,
        Amount         DECIMAL(18,2)    NOT NULL,
        PaidAt         DATETIME2(0)     NOT NULL,
        IdempotencyKey UNIQUEIDENTIFIER NOT NULL,
        Notes          NVARCHAR(500)    NULL,
        IsCancelled    BIT              NOT NULL CONSTRAINT DF_Payments_IsCancelled DEFAULT 0,
        CancelReason   NVARCHAR(500)    NULL,
        CancelledAt    DATETIME2(0)     NULL,
        CancelledBy    UNIQUEIDENTIFIER NULL,
        RowVersion     ROWVERSION       NOT NULL,
        CreatedAt      DATETIME2(0)     NOT NULL CONSTRAINT DF_Payments_CreatedAt DEFAULT GETDATE(),
        -- Operatorul care a încasat
        CreatedBy      UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_Payments PRIMARY KEY (Id),
        CONSTRAINT FK_Payments_Clinics       FOREIGN KEY (ClinicId)       REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_Payments_Consultations FOREIGN KEY (ConsultationId) REFERENCES dbo.Consultations(Id),
        CONSTRAINT FK_Payments_Patients      FOREIGN KEY (PatientId)      REFERENCES dbo.Patients(Id),
        CONSTRAINT UQ_Payments_Idempotency   UNIQUE (ClinicId, IdempotencyKey),
        CONSTRAINT CK_Payments_Amount        CHECK (Amount > 0)
    );

    CREATE NONCLUSTERED INDEX IX_Payments_Consultation
        ON dbo.Payments (ConsultationId, IsCancelled) INCLUDE (Amount, PaidAt);

    CREATE NONCLUSTERED INDEX IX_Payments_Clinic_PaidAt
        ON dbo.Payments (ClinicId, PaidAt DESC) INCLUDE (Amount, IsCancelled);

    PRINT 'Tabel Payments creat.';
END
GO

-- ── PaymentTenders (defalcare pe metode: numerar + card pe aceeași plată) ────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PaymentTenders')
BEGIN
    CREATE TABLE dbo.PaymentTenders (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_PaymentTenders_Id DEFAULT NEWSEQUENTIALID(),
        PaymentId       UNIQUEIDENTIFIER NOT NULL,
        PaymentMethodId UNIQUEIDENTIFIER NOT NULL,
        Amount          DECIMAL(18,2)    NOT NULL,
        CONSTRAINT PK_PaymentTenders PRIMARY KEY (Id),
        CONSTRAINT FK_PaymentTenders_Payments FOREIGN KEY (PaymentId)       REFERENCES dbo.Payments(Id),
        CONSTRAINT FK_PaymentTenders_Methods  FOREIGN KEY (PaymentMethodId) REFERENCES dbo.PaymentMethods(Id),
        CONSTRAINT UQ_PaymentTenders_Method   UNIQUE (PaymentId, PaymentMethodId),
        CONSTRAINT CK_PaymentTenders_Amount   CHECK (Amount > 0)
    );

    PRINT 'Tabel PaymentTenders creat.';
END
GO

-- ── InvoiceStatuses ──────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'InvoiceStatuses')
BEGIN
    CREATE TABLE dbo.InvoiceStatuses (
        Id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_InvoiceStatuses_Id DEFAULT NEWSEQUENTIALID(),
        Code      NVARCHAR(30)     NOT NULL,
        Name      NVARCHAR(100)    NOT NULL,
        SortOrder INT              NOT NULL CONSTRAINT DF_InvoiceStatuses_SortOrder DEFAULT 0,
        IsActive  BIT              NOT NULL CONSTRAINT DF_InvoiceStatuses_IsActive DEFAULT 1,
        CONSTRAINT PK_InvoiceStatuses PRIMARY KEY (Id),
        CONSTRAINT UQ_InvoiceStatuses_Code UNIQUE (Code)
    );

    INSERT INTO dbo.InvoiceStatuses (Id, Code, Name, SortOrder) VALUES
        ('F4000000-0000-0000-0000-000000000001', N'EMISA',    N'Emisă',    1),
        ('F4000000-0000-0000-0000-000000000002', N'STORNATA', N'Stornată', 2);

    PRINT 'Tabel InvoiceStatuses creat + seed.';
END
GO

-- ── InvoiceSeries ────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'InvoiceSeries')
BEGIN
    CREATE TABLE dbo.InvoiceSeries (
        Id         UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_InvoiceSeries_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId   UNIQUEIDENTIFIER NOT NULL,
        Series     NVARCHAR(10)     NOT NULL,
        -- Ultimul număr alocat; următoarea factură primește LastNumber + 1
        LastNumber INT              NOT NULL CONSTRAINT DF_InvoiceSeries_LastNumber DEFAULT 0,
        IsDefault  BIT              NOT NULL CONSTRAINT DF_InvoiceSeries_IsDefault DEFAULT 0,
        IsActive   BIT              NOT NULL CONSTRAINT DF_InvoiceSeries_IsActive DEFAULT 1,
        CreatedAt  DATETIME2(0)     NOT NULL CONSTRAINT DF_InvoiceSeries_CreatedAt DEFAULT GETDATE(),
        CreatedBy  UNIQUEIDENTIFIER NULL,
        UpdatedAt  DATETIME2(0)     NULL,
        UpdatedBy  UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_InvoiceSeries PRIMARY KEY (Id),
        CONSTRAINT FK_InvoiceSeries_Clinics FOREIGN KEY (ClinicId) REFERENCES dbo.Clinics(Id),
        CONSTRAINT UQ_InvoiceSeries_Clinic_Series UNIQUE (ClinicId, Series),
        CONSTRAINT CK_InvoiceSeries_LastNumber CHECK (LastNumber >= 0)
    );

    -- O singură serie implicită per clinică
    CREATE UNIQUE NONCLUSTERED INDEX UQ_InvoiceSeries_Clinic_Default
        ON dbo.InvoiceSeries (ClinicId) WHERE IsDefault = 1;

    -- Serie implicită pentru clinicile existente — se poate redenumi din Setări înainte de prima factură
    INSERT INTO dbo.InvoiceSeries (ClinicId, Series, LastNumber, IsDefault, IsActive)
    SELECT c.Id, N'FCT', 0, 1, 1 FROM dbo.Clinics c;

    PRINT 'Tabel InvoiceSeries creat + seed.';
END
GO

-- ── Invoices ─────────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Invoices')
BEGIN
    CREATE TABLE dbo.Invoices (
        Id                          UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Invoices_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId                    UNIQUEIDENTIFIER NOT NULL,
        ConsultationId              UNIQUEIDENTIFIER NOT NULL,
        PatientId                   UNIQUEIDENTIFIER NOT NULL,
        SeriesId                    UNIQUEIDENTIFIER NOT NULL,
        Series                      NVARCHAR(10)     NOT NULL,
        Number                      INT              NOT NULL,
        IssueDate                   DATE             NOT NULL,
        IssuedAt                    DATETIME2(0)     NOT NULL,
        -- UNTDID 1001: 380 = factură comercială (storno = 380 cu valori negative — de validat cu contabilul)
        InvoiceTypeCode             NVARCHAR(3)      NOT NULL CONSTRAINT DF_Invoices_TypeCode DEFAULT N'380',
        IsStorno                    BIT              NOT NULL CONSTRAINT DF_Invoices_IsStorno DEFAULT 0,
        OriginalInvoiceId           UNIQUEIDENTIFIER NULL,
        StornoReason                NVARCHAR(500)    NULL,
        StatusId                    UNIQUEIDENTIFIER NOT NULL,
        Currency                    NCHAR(3)         NOT NULL CONSTRAINT DF_Invoices_Currency DEFAULT N'RON',
        -- Furnizor (snapshot din Clinics la emitere)
        SupplierName                NVARCHAR(200)    NOT NULL,
        SupplierFiscalCode          NVARCHAR(20)     NOT NULL,
        SupplierTradeRegisterNumber NVARCHAR(30)     NULL,
        SupplierAddress             NVARCHAR(500)    NULL,
        SupplierCity                NVARCHAR(100)    NULL,
        SupplierCounty              NVARCHAR(100)    NULL,
        SupplierBankName            NVARCHAR(100)    NULL,
        SupplierBankAccount         NVARCHAR(34)     NULL,
        SupplierIsVatPayer          BIT              NOT NULL,
        -- Client: persoană fizică (IsLegalEntity = 0) sau juridică (1)
        CustomerIsLegalEntity       BIT              NOT NULL,
        CustomerName                NVARCHAR(200)    NOT NULL,
        -- CNP doar la cerere explicită (minimizare GDPR)
        CustomerCnp                 NCHAR(13)        NULL,
        CustomerFiscalCode          NVARCHAR(20)     NULL,
        CustomerTradeRegisterNumber NVARCHAR(30)     NULL,
        CustomerAddress             NVARCHAR(500)    NULL,
        CustomerCity                NVARCHAR(100)    NULL,
        CustomerCounty              NVARCHAR(100)    NULL,
        CustomerCountryCode         NCHAR(2)         NOT NULL CONSTRAINT DF_Invoices_CustomerCountry DEFAULT N'RO',
        TotalNet                    DECIMAL(18,2)    NOT NULL,
        TotalVat                    DECIMAL(18,2)    NOT NULL,
        Total                       DECIMAL(18,2)    NOT NULL,
        Notes                       NVARCHAR(1000)   NULL,
        IdempotencyKey              UNIQUEIDENTIFIER NOT NULL,
        -- Rezervat e-Factura (netransmis în această etapă)
        EInvoiceStatus              NVARCHAR(30)     NULL,
        EInvoiceUploadId            NVARCHAR(50)     NULL,
        RowVersion                  ROWVERSION       NOT NULL,
        CreatedAt                   DATETIME2(0)     NOT NULL CONSTRAINT DF_Invoices_CreatedAt DEFAULT GETDATE(),
        CreatedBy                   UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt                   DATETIME2(0)     NULL,
        UpdatedBy                   UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_Invoices PRIMARY KEY (Id),
        CONSTRAINT FK_Invoices_Clinics       FOREIGN KEY (ClinicId)          REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_Invoices_Consultations FOREIGN KEY (ConsultationId)    REFERENCES dbo.Consultations(Id),
        CONSTRAINT FK_Invoices_Patients      FOREIGN KEY (PatientId)         REFERENCES dbo.Patients(Id),
        CONSTRAINT FK_Invoices_Series        FOREIGN KEY (SeriesId)          REFERENCES dbo.InvoiceSeries(Id),
        CONSTRAINT FK_Invoices_Statuses      FOREIGN KEY (StatusId)          REFERENCES dbo.InvoiceStatuses(Id),
        CONSTRAINT FK_Invoices_Original      FOREIGN KEY (OriginalInvoiceId) REFERENCES dbo.Invoices(Id),
        CONSTRAINT UQ_Invoices_Number        UNIQUE (ClinicId, Series, Number),
        CONSTRAINT UQ_Invoices_Idempotency   UNIQUE (ClinicId, IdempotencyKey),
        CONSTRAINT CK_Invoices_Storno        CHECK ((IsStorno = 0 AND OriginalInvoiceId IS NULL)
                                                 OR (IsStorno = 1 AND OriginalInvoiceId IS NOT NULL)),
        CONSTRAINT CK_Invoices_Customer      CHECK (CustomerIsLegalEntity = 0 OR CustomerFiscalCode IS NOT NULL)
    );

    -- O singură factură activă (emisă, nestornată) per consultație — plasa de siguranță la dublu-click
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Invoices_ActivePerConsultation
        ON dbo.Invoices (ConsultationId)
        WHERE IsStorno = 0 AND StatusId = 'F4000000-0000-0000-0000-000000000001';

    -- O factură se stornează o singură dată
    CREATE UNIQUE NONCLUSTERED INDEX UQ_Invoices_OriginalInvoice
        ON dbo.Invoices (OriginalInvoiceId) WHERE OriginalInvoiceId IS NOT NULL;

    CREATE NONCLUSTERED INDEX IX_Invoices_Clinic_IssueDate
        ON dbo.Invoices (ClinicId, IssueDate DESC) INCLUDE (Series, Number, Total, StatusId, IsStorno);

    CREATE NONCLUSTERED INDEX IX_Invoices_Consultation
        ON dbo.Invoices (ConsultationId) INCLUDE (StatusId, IsStorno, Total);

    PRINT 'Tabel Invoices creat.';
END
GO

-- ── InvoiceLines ─────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'InvoiceLines')
BEGIN
    CREATE TABLE dbo.InvoiceLines (
        Id                    UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_InvoiceLines_Id DEFAULT NEWSEQUENTIALID(),
        InvoiceId             UNIQUEIDENTIFIER NOT NULL,
        ConsultationServiceId UNIQUEIDENTIFIER NULL,
        MedicalServiceId      UNIQUEIDENTIFIER NULL,
        Code                  NVARCHAR(30)     NULL,
        Name                  NVARCHAR(200)    NOT NULL,
        -- UN/ECE Rec. 20: C62 = unitate (bucată / serviciu)
        UnitCode              NVARCHAR(3)      NOT NULL CONSTRAINT DF_InvoiceLines_UnitCode DEFAULT N'C62',
        -- Negativ pe factura storno
        Quantity              DECIMAL(10,3)    NOT NULL,
        UnitPrice             DECIMAL(18,2)    NOT NULL,
        LineTotal             DECIMAL(18,2)    NOT NULL,
        VatRateId             UNIQUEIDENTIFIER NOT NULL,
        VatPercent            DECIMAL(5,2)     NOT NULL,
        VatCategoryCode       NVARCHAR(3)      NOT NULL,
        VatExemptionReasonCode NVARCHAR(30)    NULL,
        VatExemptionReasonText NVARCHAR(300)   NULL,
        VatAmount             DECIMAL(18,2)    NOT NULL,
        NetAmount             DECIMAL(18,2)    NOT NULL,
        SortOrder             INT              NOT NULL CONSTRAINT DF_InvoiceLines_SortOrder DEFAULT 0,
        CONSTRAINT PK_InvoiceLines PRIMARY KEY (Id),
        CONSTRAINT FK_InvoiceLines_Invoices FOREIGN KEY (InvoiceId)        REFERENCES dbo.Invoices(Id),
        CONSTRAINT FK_InvoiceLines_Services FOREIGN KEY (MedicalServiceId) REFERENCES dbo.MedicalServices(Id),
        CONSTRAINT FK_InvoiceLines_VatRates FOREIGN KEY (VatRateId)        REFERENCES dbo.VatRates(Id),
        CONSTRAINT CK_InvoiceLines_Quantity CHECK (Quantity <> 0),
        CONSTRAINT CK_InvoiceLines_Total    CHECK (LineTotal = VatAmount + NetAmount)
    );

    CREATE NONCLUSTERED INDEX IX_InvoiceLines_Invoice ON dbo.InvoiceLines (InvoiceId, SortOrder);

    PRINT 'Tabel InvoiceLines creat.';
END
GO

-- ── Table types ──────────────────────────────────────────────────────────────
IF TYPE_ID('dbo.PaymentTenderTableType') IS NULL
    CREATE TYPE dbo.PaymentTenderTableType AS TABLE (
        PaymentMethodId UNIQUEIDENTIFIER NOT NULL,
        Amount          DECIMAL(18,2)    NOT NULL
    );
GO

-- Liniile introduse manual pe factura de corecție (după storno)
IF TYPE_ID('dbo.InvoiceLineInputTableType') IS NULL
    CREATE TYPE dbo.InvoiceLineInputTableType AS TABLE (
        MedicalServiceId UNIQUEIDENTIFIER NULL,
        Code             NVARCHAR(30)     NULL,
        Name             NVARCHAR(200)    NOT NULL,
        UnitPrice        DECIMAL(18,2)    NOT NULL,
        Quantity         DECIMAL(10,3)    NOT NULL,
        VatRateId        UNIQUEIDENTIFIER NOT NULL,
        SortOrder        INT              NOT NULL
    );
GO

PRINT 'Migrarea 0055_CreatePaymentsAndInvoices finalizata cu succes.';
GO
