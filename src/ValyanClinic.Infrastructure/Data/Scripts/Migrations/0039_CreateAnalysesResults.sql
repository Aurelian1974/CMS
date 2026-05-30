-- ============================================================================
-- Migrare 0039: Tabele AnalysesResults si AnalysesResultDetails
--
-- Tabele noi:
--   1. dbo.AnalysesResults       - header buletin (laborator, date, pacient)
--   2. dbo.AnalysesResultDetails - linii rezultat (test, valoare, UM, interval)
--
-- Note:
--   - PatientId/ConsultationId FK pentru traseabilitate si trending
--   - ResultDate default = CollectionDate cand nu este completata (calculat in SP)
--   - SortOrder pe detalii pentru pastrarea ordinii din buletin
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- ── 1. dbo.AnalysesResults (header buletin) ─────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AnalysesResults')
BEGIN
    CREATE TABLE dbo.AnalysesResults (
        Id                UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_AnalysesResults_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId          UNIQUEIDENTIFIER NOT NULL,
        PatientId         UNIQUEIDENTIFIER NOT NULL,
        ConsultationId    UNIQUEIDENTIFIER NULL,
        Laboratory        NVARCHAR(200)    NULL,
        BulletinNumber    NVARCHAR(100)    NULL,
        CollectionDate    DATE             NOT NULL,
        ResultDate        DATE             NOT NULL,
        DoctorName        NVARCHAR(300)    NULL,
        IsDeleted         BIT              NOT NULL CONSTRAINT DF_AnalysesResults_IsDeleted    DEFAULT 0,
        CreatedAt         DATETIME2(0)     NOT NULL CONSTRAINT DF_AnalysesResults_CreatedAt    DEFAULT SYSDATETIME(),
        CreatedBy         UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt         DATETIME2(0)     NULL,
        UpdatedBy         UNIQUEIDENTIFIER NULL,

        CONSTRAINT PK_AnalysesResults PRIMARY KEY (Id),
        CONSTRAINT FK_AnalysesResults_Clinics      FOREIGN KEY (ClinicId)       REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_AnalysesResults_Patients     FOREIGN KEY (PatientId)      REFERENCES dbo.Patients(Id),
        CONSTRAINT FK_AnalysesResults_Consultations FOREIGN KEY (ConsultationId) REFERENCES dbo.Consultations(Id)
    );
    PRINT 'Tabel AnalysesResults creat.';
END
ELSE
    PRINT 'Tabel AnalysesResults exista deja - ignorat.';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AnalysesResults_ClinicId_PatientId')
    CREATE NONCLUSTERED INDEX IX_AnalysesResults_ClinicId_PatientId
        ON dbo.AnalysesResults (ClinicId, PatientId)
        INCLUDE (CollectionDate, ResultDate, Laboratory, IsDeleted)
        WHERE IsDeleted = 0;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AnalysesResults_ConsultationId')
    CREATE NONCLUSTERED INDEX IX_AnalysesResults_ConsultationId
        ON dbo.AnalysesResults (ConsultationId)
        WHERE IsDeleted = 0;
GO

-- ── 2. dbo.AnalysesResultDetails (linii buletin) ────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'AnalysesResultDetails')
BEGIN
    CREATE TABLE dbo.AnalysesResultDetails (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_AnalysesResultDetails_Id DEFAULT NEWSEQUENTIALID(),
        ClinicId        UNIQUEIDENTIFIER NOT NULL,
        ResultId        UNIQUEIDENTIFIER NOT NULL,
        Section         NVARCHAR(100)    NOT NULL CONSTRAINT DF_AnalysesResultDetails_Section DEFAULT N'GENERAL',
        TestName        NVARCHAR(300)    NOT NULL,
        Value           NVARCHAR(200)    NOT NULL,
        Unit            NVARCHAR(50)     NULL,
        ReferenceRange  NVARCHAR(200)    NULL,
        RefMin          DECIMAL(18, 4)   NULL,
        RefMax          DECIMAL(18, 4)   NULL,
        Flag            NVARCHAR(20)     NULL,   -- null / HIGH / LOW / CHECK
        Method          NVARCHAR(200)    NULL,
        Notes           NVARCHAR(500)    NULL,
        SortOrder       INT              NOT NULL CONSTRAINT DF_AnalysesResultDetails_SortOrder DEFAULT 0,
        IsDeleted       BIT              NOT NULL CONSTRAINT DF_AnalysesResultDetails_IsDeleted DEFAULT 0,
        CreatedAt       DATETIME2(0)     NOT NULL CONSTRAINT DF_AnalysesResultDetails_CreatedAt DEFAULT SYSDATETIME(),
        CreatedBy       UNIQUEIDENTIFIER NOT NULL,

        CONSTRAINT PK_AnalysesResultDetails PRIMARY KEY (Id),
        CONSTRAINT FK_AnalysesResultDetails_Clinics  FOREIGN KEY (ClinicId)  REFERENCES dbo.Clinics(Id),
        CONSTRAINT FK_AnalysesResultDetails_Results  FOREIGN KEY (ResultId)  REFERENCES dbo.AnalysesResults(Id)
    );
    PRINT 'Tabel AnalysesResultDetails creat.';
END
ELSE
    PRINT 'Tabel AnalysesResultDetails exista deja - ignorat.';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AnalysesResultDetails_ResultId')
    CREATE NONCLUSTERED INDEX IX_AnalysesResultDetails_ResultId
        ON dbo.AnalysesResultDetails (ResultId, SortOrder)
        WHERE IsDeleted = 0;
GO
