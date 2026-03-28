-- =============================================================================
-- 0030 — ANM Nomenclator: tabel medicamente omologate, sincronizare cu
--        nomenclator.anm.ro (fișier Excel nomenclator.xlsx)
-- =============================================================================

-- ── 1. Adăugare modul ANM în tabelul Modules ─────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM dbo.Modules WHERE Code = 'anm')
BEGIN
    INSERT INTO dbo.Modules (Id, Code, Name, Description, SortOrder, IsActive)
    VALUES ('E2000001-0000-0000-0000-00000000000E', 'anm', 'ANM', 'Nomenclatorul medicamentelor omologate ANMDMR', 14, 1);
END;
GO

-- ── 2. Permisiuni implicite Admin pentru modulul ANM ─────────────────────────
-- Adăugăm permisiuni Write (nivel 2) pentru rolul Admin (dacă nu există deja)
IF NOT EXISTS (
    SELECT 1 FROM dbo.RoleModulePermissions rp
    INNER JOIN dbo.Modules m ON m.Id = rp.ModuleId
    WHERE m.Code = 'anm'
)
BEGIN
    INSERT INTO dbo.RoleModulePermissions (RoleId, ModuleId, AccessLevelId)
    SELECT
        r.Id AS RoleId,
        m.Id AS ModuleId,
        al.Id AS AccessLevelId
    FROM dbo.Roles r
    CROSS JOIN dbo.Modules m
    CROSS JOIN dbo.AccessLevels al
    WHERE r.Code   = 'admin'
      AND m.Code   = 'anm'
      AND al.Level = 2;   -- Write
END;
GO

-- ── 3. Anm_Drug — catalogul complet al medicamentelor omologate ANMDMR ───────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Anm_Drug')
BEGIN
    CREATE TABLE dbo.Anm_Drug (
        -- Codul de autorizare ANM (ex: W43451001) — cheie primară naturală
        AuthorizationCode   NVARCHAR(50)    NOT NULL,
        CommercialName      NVARCHAR(500)   NOT NULL,
        InnName             NVARCHAR(500)   NULL,   -- Substanța activă / DCI
        PharmaceuticalForm  NVARCHAR(300)   NULL,
        AtcCode             NVARCHAR(20)    NULL,
        Company             NVARCHAR(500)   NULL,   -- Deținătorul autorizației
        Country             NVARCHAR(100)   NULL,
        DispenseMode        NVARCHAR(50)    NULL,   -- OTC / PRF / P-RF etc.
        IsActive            BIT             NOT NULL DEFAULT 1,
        SyncedAt            DATETIME2       NOT NULL DEFAULT GETDATE(),

        CONSTRAINT PK_Anm_Drug PRIMARY KEY (AuthorizationCode)
    );

    CREATE INDEX IX_Anm_Drug_CommercialName ON dbo.Anm_Drug (CommercialName);
    CREATE INDEX IX_Anm_Drug_InnName        ON dbo.Anm_Drug (InnName);
    CREATE INDEX IX_Anm_Drug_AtcCode        ON dbo.Anm_Drug (AtcCode);
    CREATE INDEX IX_Anm_Drug_IsActive       ON dbo.Anm_Drug (IsActive);

    PRINT 'Tabel Anm_Drug creat.';
END;
GO

-- ── 4. Anm_SyncLog — jurnalul sincronizărilor cu ANM ────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Anm_SyncLog')
BEGIN
    CREATE TABLE dbo.Anm_SyncLog (
        Id              UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        StartedAt       DATETIME2        NOT NULL DEFAULT GETDATE(),
        FinishedAt      DATETIME2        NULL,
        Status          NVARCHAR(20)     NOT NULL DEFAULT 'Running',   -- Running / Success / Failed
        TriggeredBy     NVARCHAR(200)    NULL,
        TotalProcessed  INT              NULL,
        TotalInserted   INT              NULL,
        TotalUpdated    INT              NULL,
        DurationSeconds INT              NULL,
        ErrorMessage    NVARCHAR(2000)   NULL,
        ExcelUrl        NVARCHAR(500)    NULL
    );

    PRINT 'Tabel Anm_SyncLog creat.';
END;
GO
