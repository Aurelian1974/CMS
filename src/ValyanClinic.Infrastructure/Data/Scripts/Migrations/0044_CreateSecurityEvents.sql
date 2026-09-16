-- =============================================================================
-- Migrare 0044: Tabel SecurityEvents — jurnal al evenimentelor de autentificare
--
-- Pana acum nu exista niciun apel de audit in Features/Auth: login reusit sau
-- esuat, blocare de cont, logout, schimbare de parola si detectia de reutilizare
-- a token-ului nu lasau nicio urma. Pentru o aplicatie care proceseaza date
-- medicale, aceasta e o lipsa de conformitate (GDPR art. 32).
--
-- Tabel separat de AuditLogs, nu o relaxare a acestuia: AuditLogs are ClinicId si
-- ChangedBy NOT NULL, plus FK catre Clinics. Un login esuat cu un email necunoscut
-- nu are nici utilizator, nici clinica — exact cazul cel mai important de jurnalizat.
-- Vezi DECIZII_ARHITECTURA_AUTH.md, decizia D3.
-- =============================================================================

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SecurityEvents')
BEGIN
    CREATE TABLE dbo.SecurityEvents (
        Id             UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID() PRIMARY KEY,
        EventType      NVARCHAR(50)     NOT NULL,
        -- NULL cand utilizatorul nu a putut fi identificat (email necunoscut)
        UserId         UNIQUEIDENTIFIER NULL,
        -- Fara FK catre Clinics, intentionat: evenimentul trebuie scris chiar si
        -- cand clinica e necunoscuta. Renuntam la integritatea referentiala in
        -- schimbul garantiei ca jurnalul nu are goluri.
        ClinicId       UNIQUEIDENTIFIER NULL,
        -- Valoarea introdusa in formular la un login esuat
        EmailAttempted NVARCHAR(200)    NULL,
        IpAddress      NVARCHAR(50)     NULL,
        UserAgent      NVARCHAR(500)    NULL,
        Succeeded      BIT              NOT NULL,
        Details        NVARCHAR(MAX)    NULL,
        OccurredAt     DATETIME2        NOT NULL DEFAULT SYSUTCDATETIME()
    );

    PRINT 'Tabelul SecurityEvents a fost creat.';
END;
GO

-- Vizualizare cronologica si retentie
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SecurityEvents_OccurredAt' AND object_id = OBJECT_ID('SecurityEvents'))
    CREATE NONCLUSTERED INDEX IX_SecurityEvents_OccurredAt
        ON dbo.SecurityEvents (OccurredAt DESC)
        INCLUDE (EventType, UserId, Succeeded);
GO

-- Istoricul unui utilizator anume
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SecurityEvents_UserId' AND object_id = OBJECT_ID('SecurityEvents'))
    CREATE NONCLUSTERED INDEX IX_SecurityEvents_UserId
        ON dbo.SecurityEvents (UserId, OccurredAt DESC)
        WHERE UserId IS NOT NULL;
GO

-- Investigarea atacurilor de tip credential stuffing: ce adrese au fost incercate
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SecurityEvents_EmailAttempted' AND object_id = OBJECT_ID('SecurityEvents'))
    CREATE NONCLUSTERED INDEX IX_SecurityEvents_EmailAttempted
        ON dbo.SecurityEvents (EmailAttempted, OccurredAt DESC)
        WHERE EmailAttempted IS NOT NULL;
GO

-- Corelarea incercarilor venite de la aceeasi adresa
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SecurityEvents_IpAddress' AND object_id = OBJECT_ID('SecurityEvents'))
    CREATE NONCLUSTERED INDEX IX_SecurityEvents_IpAddress
        ON dbo.SecurityEvents (IpAddress, OccurredAt DESC)
        WHERE IpAddress IS NOT NULL;
GO

PRINT 'Migrarea 0044_CreateSecurityEvents finalizata cu succes.';
GO
