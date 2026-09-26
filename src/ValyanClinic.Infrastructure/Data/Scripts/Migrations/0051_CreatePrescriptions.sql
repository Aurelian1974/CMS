-- ============================================================================
-- Migrare 0051: Rețete (prescripții) — compensate CNAS și simple (necompensate)
-- Nomenclatoare: tipuri, statusuri, tipuri de afecțiune (acut/cronic), categorii
-- de asigurat. Contor de numerotare per clinică / tip / serie.
-- Medicamentele sunt snapshot la prescriere (inclusiv procentul de compensare).
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ── PrescriptionTypes ────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PrescriptionTypes')
BEGIN
    CREATE TABLE dbo.PrescriptionTypes (
        Id                  UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_PrescriptionTypes_Id DEFAULT NEWSEQUENTIALID(),
        Code                NVARCHAR(30)     NOT NULL,
        Name                NVARCHAR(100)    NOT NULL,
        -- 1 = rețetă compensată CNAS (transmisă în SIPE); 0 = rețetă simplă
        IsCnas              BIT              NOT NULL,
        DefaultSeries       NVARCHAR(10)     NOT NULL,
        -- Numărul maxim de medicamente pe o rețetă; NULL = nelimitat
        MaxItems            INT              NULL,
        -- Valabilitatea implicită (zile) când nu se aplică tipul de afecțiune
        DefaultValidityDays INT              NULL,
        SortOrder           INT              NOT NULL CONSTRAINT DF_PrescriptionTypes_SortOrder DEFAULT 0,
        IsActive            BIT              NOT NULL CONSTRAINT DF_PrescriptionTypes_IsActive DEFAULT 1,
        CONSTRAINT PK_PrescriptionTypes PRIMARY KEY (Id),
        CONSTRAINT UQ_PrescriptionTypes_Code UNIQUE (Code)
    );

    INSERT INTO dbo.PrescriptionTypes (Id, Code, Name, IsCnas, DefaultSeries, MaxItems, DefaultValidityDays, SortOrder) VALUES
        ('D5000000-0000-0000-0000-000000000001', N'COMPENSATA', N'Compensată (CNAS)',     1, N'RC', 7,    30, 1),
        ('D5000000-0000-0000-0000-000000000002', N'SIMPLA',     N'Simplă (necompensată)', 0, N'RS', NULL, 30, 2);

    PRINT 'Tabel PrescriptionTypes creat + seed.';
END
GO

-- ── PrescriptionStatuses ─────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PrescriptionStatuses')
BEGIN
    CREATE TABLE dbo.PrescriptionStatuses (
        Id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_PrescriptionStatuses_Id DEFAULT NEWSEQUENTIALID(),
        Code      NVARCHAR(30)     NOT NULL,
        Name      NVARCHAR(100)    NOT NULL,
        SortOrder INT              NOT NULL CONSTRAINT DF_PrescriptionStatuses_SortOrder DEFAULT 0,
        IsActive  BIT              NOT NULL CONSTRAINT DF_PrescriptionStatuses_IsActive DEFAULT 1,
        CONSTRAINT PK_PrescriptionStatuses PRIMARY KEY (Id),
        CONSTRAINT UQ_PrescriptionStatuses_Code UNIQUE (Code)
    );

    INSERT INTO dbo.PrescriptionStatuses (Id, Code, Name, SortOrder) VALUES
        ('D5100000-0000-0000-0000-000000000001', N'CIORNA',    N'Ciornă',    1),
        ('D5100000-0000-0000-0000-000000000002', N'EMISA',     N'Emisă',     2),
        ('D5100000-0000-0000-0000-000000000003', N'TRANSMISA', N'Transmisă', 3),
        ('D5100000-0000-0000-0000-000000000004', N'ELIBERATA', N'Eliberată', 4),
        ('D5100000-0000-0000-0000-000000000005', N'ANULATA',   N'Anulată',   5);

    PRINT 'Tabel PrescriptionStatuses creat + seed.';
END
GO

-- ── PrescriptionCareTypes (tip afecțiune: durată maximă + valabilitate) ──────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PrescriptionCareTypes')
BEGIN
    CREATE TABLE dbo.PrescriptionCareTypes (
        Id           UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_PrescriptionCareTypes_Id DEFAULT NEWSEQUENTIALID(),
        Code         NVARCHAR(30)     NOT NULL,
        Name         NVARCHAR(100)    NOT NULL,
        MaxDays      INT              NOT NULL,
        ValidityDays INT              NOT NULL,
        SortOrder    INT              NOT NULL CONSTRAINT DF_PrescriptionCareTypes_SortOrder DEFAULT 0,
        IsActive     BIT              NOT NULL CONSTRAINT DF_PrescriptionCareTypes_IsActive DEFAULT 1,
        CONSTRAINT PK_PrescriptionCareTypes PRIMARY KEY (Id),
        CONSTRAINT UQ_PrescriptionCareTypes_Code UNIQUE (Code)
    );

    INSERT INTO dbo.PrescriptionCareTypes (Id, Code, Name, MaxDays, ValidityDays, SortOrder) VALUES
        ('D5200000-0000-0000-0000-000000000001', N'ACUT',      N'Acut (max. 7 zile)',           7,  2,  1),
        ('D5200000-0000-0000-0000-000000000002', N'SUBACUT',   N'Subacut (max. 10 zile)',       10, 30, 2),
        ('D5200000-0000-0000-0000-000000000003', N'CRONIC',    N'Cronic (max. 30 zile)',        30, 30, 3),
        ('D5200000-0000-0000-0000-000000000004', N'CRONIC_90', N'Cronic stabilizat (max. 90 zile)', 90, 92, 4);

    PRINT 'Tabel PrescriptionCareTypes creat + seed.';
END
GO

-- ── PrescriptionInsuredCategories (categoria de asigurat pe rețeta compensată) ─
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PrescriptionInsuredCategories')
BEGIN
    CREATE TABLE dbo.PrescriptionInsuredCategories (
        Id        UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_PrescriptionInsuredCategories_Id DEFAULT NEWSEQUENTIALID(),
        Code      NVARCHAR(30)     NOT NULL,
        Name      NVARCHAR(200)    NOT NULL,
        SortOrder INT              NOT NULL CONSTRAINT DF_PrescriptionInsuredCategories_SortOrder DEFAULT 0,
        IsActive  BIT              NOT NULL CONSTRAINT DF_PrescriptionInsuredCategories_IsActive DEFAULT 1,
        CONSTRAINT PK_PrescriptionInsuredCategories PRIMARY KEY (Id),
        CONSTRAINT UQ_PrescriptionInsuredCategories_Code UNIQUE (Code)
    );

    INSERT INTO dbo.PrescriptionInsuredCategories (Id, Code, Name, SortOrder) VALUES
        ('D5300000-0000-0000-0000-000000000001', N'SALARIAT',        N'Salariat / asigurat cu contribuție', 1),
        ('D5300000-0000-0000-0000-000000000002', N'PENSIONAR',       N'Pensionar',                          2),
        ('D5300000-0000-0000-0000-000000000003', N'PENSIONAR_PRAG',  N'Pensionar cu venit sub plafon (90%)', 3),
        ('D5300000-0000-0000-0000-000000000004', N'COPIL',           N'Copil (0-18 ani)',                   4),
        ('D5300000-0000-0000-0000-000000000005', N'ELEV_STUDENT',    N'Elev / student (18-26 ani)',         5),
        ('D5300000-0000-0000-0000-000000000006', N'GRAVIDA_LAUZA',   N'Gravidă / lăuză',                    6),
        ('D5300000-0000-0000-0000-000000000007', N'HANDICAP',        N'Persoană cu handicap',               7),
        ('D5300000-0000-0000-0000-000000000008', N'VETERAN',         N'Veteran / revoluționar / lege specială', 8),
        ('D5300000-0000-0000-0000-000000000009', N'PNS',             N'Asigurat în program național de sănătate', 9),
        ('D5300000-0000-0000-0000-00000000000A', N'ALTE',            N'Altă categorie',                     10);

    PRINT 'Tabel PrescriptionInsuredCategories creat + seed.';
END
GO

-- ── Prescriptions ────────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Prescriptions')
BEGIN
    CREATE TABLE dbo.Prescriptions (
        Id                   UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_Prescriptions_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId             UNIQUEIDENTIFIER NOT NULL,
        PatientId            UNIQUEIDENTIFIER NOT NULL,
        DoctorId             UNIQUEIDENTIFIER NOT NULL,
        ConsultationId       UNIQUEIDENTIFIER NULL,
        PrescriptionTypeId   UNIQUEIDENTIFIER NOT NULL,
        StatusId             UNIQUEIDENTIFIER NOT NULL,
        CareTypeId           UNIQUEIDENTIFIER NULL,
        InsuredCategoryId    UNIQUEIDENTIFIER NULL,
        -- Programul național (din lista de compensare a medicamentelor); o rețetă = un program
        NhpCode              NVARCHAR(30)     NULL,
        Series               NVARCHAR(10)     NULL,
        Number               INT              NULL,
        IssueDate            DATETIME2(0)     NULL,
        ValidUntil           DATE             NULL,
        TreatmentDays        INT              NULL,
        Diagnostic           NVARCHAR(1000)   NULL,
        DiagnosticCodes      NVARCHAR(500)    NULL,
        RegistryNumber       NVARCHAR(50)     NULL,
        IsContinuation       BIT              NOT NULL CONSTRAINT DF_Prescriptions_IsContinuation DEFAULT 0,
        ReferralLetterNumber NVARCHAR(50)     NULL,
        Notes                NVARCHAR(1000)   NULL,
        -- Integrare SIPE (doar rețete compensate)
        ElectronicId         NVARCHAR(50)     NULL,
        IsOffline            BIT              NOT NULL CONSTRAINT DF_Prescriptions_IsOffline DEFAULT 0,
        TransmittedAt        DATETIME2(0)     NULL,
        TransmissionError    NVARCHAR(1000)   NULL,
        CancelReason         NVARCHAR(500)    NULL,
        CancelledAt          DATETIME2(0)     NULL,
        CancelledBy          UNIQUEIDENTIFIER NULL,
        IsDeleted            BIT              NOT NULL CONSTRAINT DF_Prescriptions_IsDeleted DEFAULT 0,
        CreatedAt            DATETIME2(0)     NOT NULL CONSTRAINT DF_Prescriptions_CreatedAt DEFAULT GETDATE(),
        CreatedBy            UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt            DATETIME2(0)     NULL,
        UpdatedBy            UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_Prescriptions PRIMARY KEY (Id),
        CONSTRAINT FK_Prescriptions_Clinic          FOREIGN KEY (ClinicId)           REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_Prescriptions_Patient         FOREIGN KEY (PatientId)          REFERENCES dbo.Patients(Id),
        CONSTRAINT FK_Prescriptions_Doctor          FOREIGN KEY (DoctorId)           REFERENCES dbo.Doctors(Id),
        CONSTRAINT FK_Prescriptions_Consultation    FOREIGN KEY (ConsultationId)     REFERENCES dbo.Consultations(Id),
        CONSTRAINT FK_Prescriptions_Type            FOREIGN KEY (PrescriptionTypeId) REFERENCES dbo.PrescriptionTypes(Id),
        CONSTRAINT FK_Prescriptions_Status          FOREIGN KEY (StatusId)           REFERENCES dbo.PrescriptionStatuses(Id),
        CONSTRAINT FK_Prescriptions_CareType        FOREIGN KEY (CareTypeId)         REFERENCES dbo.PrescriptionCareTypes(Id),
        CONSTRAINT FK_Prescriptions_InsuredCategory FOREIGN KEY (InsuredCategoryId)  REFERENCES dbo.PrescriptionInsuredCategories(Id),
        CONSTRAINT CK_Prescriptions_TreatmentDays   CHECK (TreatmentDays IS NULL OR TreatmentDays > 0)
    );
    PRINT 'Tabel Prescriptions creat.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Prescriptions_Clinic_Date')
    CREATE INDEX IX_Prescriptions_Clinic_Date
        ON dbo.Prescriptions (ClinicId, CreatedAt DESC)
        INCLUDE (PatientId, DoctorId, PrescriptionTypeId, StatusId, IssueDate)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Prescriptions_Consultation')
    CREATE INDEX IX_Prescriptions_Consultation
        ON dbo.Prescriptions (ClinicId, ConsultationId)
        WHERE IsDeleted = 0 AND ConsultationId IS NOT NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Prescriptions_Patient')
    CREATE INDEX IX_Prescriptions_Patient
        ON dbo.Prescriptions (ClinicId, PatientId, CreatedAt DESC)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Prescriptions_SeriesNumber')
    CREATE UNIQUE INDEX UX_Prescriptions_SeriesNumber
        ON dbo.Prescriptions (ClinicId, PrescriptionTypeId, Series, Number)
        WHERE Number IS NOT NULL;
GO

-- ── PrescriptionItems ────────────────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PrescriptionItems')
BEGIN
    CREATE TABLE dbo.PrescriptionItems (
        Id                       UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_PrescriptionItems_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId                 UNIQUEIDENTIFIER NOT NULL,
        PrescriptionId           UNIQUEIDENTIFIER NOT NULL,
        ConsultationMedicationId UNIQUEIDENTIFIER NULL,
        -- NULL = medicament în text liber (doar pe rețeta simplă)
        DrugCode                 NVARCHAR(50)     NULL,
        DrugName                 NVARCHAR(500)    NOT NULL,
        ActiveSubstance          NVARCHAR(200)    NULL,
        PharmaceuticalForm       NVARCHAR(200)    NULL,
        Concentration            NVARCHAR(200)    NULL,
        PrescriptionMode         NVARCHAR(50)     NULL,
        CopaymentListType        NVARCHAR(20)     NULL,
        CopaymentPercent         DECIMAL(5,2)     NULL,
        DiagnosisCode            NVARCHAR(20)     NULL,
        DoseMorning              DECIMAL(4,2)     NULL,
        DoseAfternoon            DECIMAL(4,2)     NULL,
        DoseEvening              DECIMAL(4,2)     NULL,
        DurationDays             INT              NULL,
        Quantity                 DECIMAL(9,2)     NULL,
        Instructions             NVARCHAR(1000)   NULL,
        SortOrder                INT              NOT NULL CONSTRAINT DF_PrescriptionItems_SortOrder DEFAULT 0,
        IsDeleted                BIT              NOT NULL CONSTRAINT DF_PrescriptionItems_IsDeleted DEFAULT 0,
        CreatedAt                DATETIME2(0)     NOT NULL CONSTRAINT DF_PrescriptionItems_CreatedAt DEFAULT GETDATE(),
        CreatedBy                UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt                DATETIME2(0)     NULL,
        UpdatedBy                UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_PrescriptionItems PRIMARY KEY (Id),
        CONSTRAINT FK_PrescriptionItems_Clinic       FOREIGN KEY (ClinicId)                 REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_PrescriptionItems_Prescription FOREIGN KEY (PrescriptionId)           REFERENCES dbo.Prescriptions(Id),
        CONSTRAINT FK_PrescriptionItems_ConsMed      FOREIGN KEY (ConsultationMedicationId) REFERENCES dbo.ConsultationMedications(Id),
        CONSTRAINT FK_PrescriptionItems_Drug         FOREIGN KEY (DrugCode)                 REFERENCES dbo.Cnas_Drug(Code),
        CONSTRAINT CK_PrescriptionItems_Doses CHECK (
            (DoseMorning   IS NULL OR DoseMorning   > 0) AND
            (DoseAfternoon IS NULL OR DoseAfternoon > 0) AND
            (DoseEvening   IS NULL OR DoseEvening   > 0))
    );
    PRINT 'Tabel PrescriptionItems creat.';
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PrescriptionItems_Prescription')
    CREATE INDEX IX_PrescriptionItems_Prescription
        ON dbo.PrescriptionItems (ClinicId, PrescriptionId, SortOrder)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_PrescriptionItems_ConsMed')
    CREATE INDEX IX_PrescriptionItems_ConsMed
        ON dbo.PrescriptionItems (ConsultationMedicationId)
        WHERE IsDeleted = 0 AND ConsultationMedicationId IS NOT NULL;
GO

-- ── PrescriptionSeriesCounters (numerotare internă per clinică / tip / serie) ─
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'PrescriptionSeriesCounters')
BEGIN
    CREATE TABLE dbo.PrescriptionSeriesCounters (
        ClinicId           UNIQUEIDENTIFIER NOT NULL,
        PrescriptionTypeId UNIQUEIDENTIFIER NOT NULL,
        Series             NVARCHAR(10)     NOT NULL,
        LastNumber         INT              NOT NULL,
        UpdatedAt          DATETIME2(0)     NOT NULL CONSTRAINT DF_PrescriptionSeriesCounters_UpdatedAt DEFAULT GETDATE(),
        CONSTRAINT PK_PrescriptionSeriesCounters PRIMARY KEY (ClinicId, PrescriptionTypeId, Series),
        CONSTRAINT FK_PrescriptionSeriesCounters_Clinic FOREIGN KEY (ClinicId)           REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_PrescriptionSeriesCounters_Type   FOREIGN KEY (PrescriptionTypeId) REFERENCES dbo.PrescriptionTypes(Id)
    );
    PRINT 'Tabel PrescriptionSeriesCounters creat.';
END
GO

-- ── TVP: medicamentele trimise la creare / actualizare ────────────────────────
IF NOT EXISTS (SELECT 1 FROM sys.types WHERE name = 'PrescriptionItemTableType')
BEGIN
    CREATE TYPE dbo.PrescriptionItemTableType AS TABLE (
        ConsultationMedicationId UNIQUEIDENTIFIER NULL,
        DrugCode                 NVARCHAR(50)     NULL,
        DrugName                 NVARCHAR(500)    NULL,
        CopaymentListType        NVARCHAR(20)     NULL,
        DiagnosisCode            NVARCHAR(20)     NULL,
        DoseMorning              DECIMAL(4,2)     NULL,
        DoseAfternoon            DECIMAL(4,2)     NULL,
        DoseEvening              DECIMAL(4,2)     NULL,
        DurationDays             INT              NULL,
        Quantity                 DECIMAL(9,2)     NULL,
        Instructions             NVARCHAR(1000)   NULL,
        SortOrder                INT              NOT NULL
    );
    PRINT 'Tipul PrescriptionItemTableType a fost creat.';
END
GO

PRINT 'Migrarea 0051_CreatePrescriptions.sql finalizată.';
GO
