-- ============================================================================
-- Migrare 0032: Tabele SynevoAnalyses
-- Descriere: Creare tabel pentru analize medicale importate de pe Synevo
-- Data: 2026-04-13
-- ============================================================================

SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SynevoAnalyses')
BEGIN
    CREATE TABLE dbo.SynevoAnalyses (
        Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        Name            NVARCHAR(500)    NOT NULL,
        Category        NVARCHAR(200)    NOT NULL,
        Subcategory     NVARCHAR(200)    NULL,
        Price           DECIMAL(10,2)    NULL,
        SynevoUrl       NVARCHAR(1000)   NULL,
        Slug            NVARCHAR(500)    NULL,
        ImportedAt      DATETIME2(0)     NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_SynevoAnalyses PRIMARY KEY (Id)
    );

    CREATE NONCLUSTERED INDEX IX_SynevoAnalyses_Category ON dbo.SynevoAnalyses (Category);
    CREATE NONCLUSTERED INDEX IX_SynevoAnalyses_Slug ON dbo.SynevoAnalyses (Slug);

    PRINT 'Tabel SynevoAnalyses creat.';
END
ELSE
    PRINT 'Tabel SynevoAnalyses există deja — ignorat.';
GO
