-- ============================================================================
-- Migrare 0037: Modul Analize Medicale
--
-- Scop:
--   1. Adauga tip 'LabResults' in InvestigationTypeDefinitions (pentru parser PDF)
--   2. Tabel nou dbo.RecommendedAnalyses (analize recomandate per consultatie)
--      - FK -> Consultations (CASCADE)
--      - FK -> Analyses (dictionar Synevo, 2236 intrari existente)
--
-- Notes:
--   - Analizele efectuate (LabResults) folosesc tabelul existent
--     ConsultationInvestigations cu InvestigationType = 'LabResults'.
--   - Parsarea PDF se face in Application layer (nu necesita SP).
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- ── 1. Adauga tipul 'LabResults' in dictionarul de tipuri ──────────────────
MERGE dbo.InvestigationTypeDefinitions AS t
USING (VALUES
    ('LabResults', N'Analize laborator', 'Hematology', 'Lab', 'LabTable', 'General,Pneumology,Cardiology,Endocrinology', 1, 1, 5)
) AS s (TypeCode, DisplayName, Category, ParentTab, UIPattern, Specialties, HasStructuredFields, DefaultStructuredEntry, SortOrder)
ON t.TypeCode = s.TypeCode
WHEN MATCHED THEN UPDATE SET
    DisplayName = s.DisplayName,
    Category = s.Category,
    ParentTab = s.ParentTab,
    UIPattern = s.UIPattern,
    Specialties = s.Specialties,
    HasStructuredFields = s.HasStructuredFields,
    DefaultStructuredEntry = s.DefaultStructuredEntry,
    SortOrder = s.SortOrder
WHEN NOT MATCHED THEN INSERT
    (TypeCode, DisplayName, Category, ParentTab, UIPattern, Specialties, HasStructuredFields, DefaultStructuredEntry, SortOrder)
    VALUES (s.TypeCode, s.DisplayName, s.Category, s.ParentTab, s.UIPattern, s.Specialties, s.HasStructuredFields, s.DefaultStructuredEntry, s.SortOrder);
PRINT 'Tip LabResults adaugat / actualizat in InvestigationTypeDefinitions.';
GO

-- ── 2. Tabel RecommendedAnalyses ───────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'RecommendedAnalyses')
BEGIN
    CREATE TABLE dbo.RecommendedAnalyses (
        Id              UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_RecAnalyses_Id DEFAULT NEWID(),
        ClinicId        UNIQUEIDENTIFIER NOT NULL,
        ConsultationId  UNIQUEIDENTIFIER NOT NULL,
        PatientId       UNIQUEIDENTIFIER NOT NULL,    -- denormalizat
        AnalysisId      UNIQUEIDENTIFIER NOT NULL,    -- FK -> Analyses
        AnalysisName    NVARCHAR(500)    NOT NULL,    -- snapshot la momentul recomandarii
        Priority        TINYINT          NOT NULL CONSTRAINT DF_RecAnalyses_Priority DEFAULT 1, -- 0=Low,1=Normal,2=High,3=Urgent
        Notes           NVARCHAR(1000)   NULL,
        Status          TINYINT          NOT NULL CONSTRAINT DF_RecAnalyses_Status DEFAULT 0,   -- 0=Pending,1=Done,2=Cancelled
        IsDeleted       BIT              NOT NULL CONSTRAINT DF_RecAnalyses_IsDeleted DEFAULT 0,
        CreatedAt       DATETIME2(0)     NOT NULL CONSTRAINT DF_RecAnalyses_CreatedAt DEFAULT SYSDATETIME(),
        CreatedBy       UNIQUEIDENTIFIER NOT NULL,
        UpdatedAt       DATETIME2(0)     NULL,
        UpdatedBy       UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_RecommendedAnalyses PRIMARY KEY (Id),
        CONSTRAINT FK_RecAnalyses_Consultation FOREIGN KEY (ConsultationId) REFERENCES dbo.Consultations(Id) ON DELETE CASCADE,
        CONSTRAINT FK_RecAnalyses_Analysis     FOREIGN KEY (AnalysisId)     REFERENCES dbo.Analyses(Id)
    );
    PRINT 'Tabel RecommendedAnalyses creat.';
END
ELSE
    PRINT 'Tabel RecommendedAnalyses exista deja - ignorat.';
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RecAnalyses_Consultation')
    CREATE INDEX IX_RecAnalyses_Consultation ON dbo.RecommendedAnalyses (ConsultationId) WHERE IsDeleted = 0;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_RecAnalyses_Patient')
    CREATE INDEX IX_RecAnalyses_Patient ON dbo.RecommendedAnalyses (PatientId, CreatedAt DESC) WHERE IsDeleted = 0;
GO
