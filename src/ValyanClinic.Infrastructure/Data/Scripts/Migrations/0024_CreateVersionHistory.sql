-- ============================================================
-- Migrare 0024: Tabelă istoric versiuni + jurnalul commit-urilor
-- Stochează fiecare release zilnic cu commit-urile aferente.
-- ============================================================

IF NOT EXISTS (
    SELECT 1 FROM sys.tables WHERE name = 'VersionReleases' AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE TABLE dbo.VersionReleases (
        Id          INT             IDENTITY(1,1)   NOT NULL,
        Version     NVARCHAR(20)    NOT NULL,
        ReleasedAt  DATETIME2(0)    NOT NULL DEFAULT SYSUTCDATETIME(),
        Notes       NVARCHAR(500)   NULL,

        CONSTRAINT PK_VersionReleases PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT UQ_VersionReleases_Version UNIQUE (Version)
    );

    PRINT 'Tabela dbo.VersionReleases creată.';
END
ELSE
    PRINT 'Tabela dbo.VersionReleases există deja.';

GO

IF NOT EXISTS (
    SELECT 1 FROM sys.tables WHERE name = 'VersionCommits' AND schema_id = SCHEMA_ID('dbo')
)
BEGIN
    CREATE TABLE dbo.VersionCommits (
        Id              INT             IDENTITY(1,1)   NOT NULL,
        ReleaseId       INT             NOT NULL,
        CommitHash      CHAR(40)        NOT NULL,
        CommitMessage   NVARCHAR(500)   NOT NULL,
        CommitDate      DATETIME2(0)    NOT NULL,

        CONSTRAINT PK_VersionCommits PRIMARY KEY CLUSTERED (Id),
        CONSTRAINT FK_VersionCommits_Release FOREIGN KEY (ReleaseId)
            REFERENCES dbo.VersionReleases (Id) ON DELETE CASCADE
    );

    CREATE NONCLUSTERED INDEX IX_VersionCommits_ReleaseId
        ON dbo.VersionCommits (ReleaseId);

    PRINT 'Tabela dbo.VersionCommits creată.';
END
ELSE
    PRINT 'Tabela dbo.VersionCommits există deja.';
