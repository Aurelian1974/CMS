-- =============================================================================
-- SEED MOCK: 10.000 pacienți pentru testare performanță
--
-- INSTRUCȚIUNI:
--   1. Rulează tot fișierul ca un singur batch (fără GO)
--   2. Testează aplicația (paginare, filtrare, sortare, performanță)
--   3. Rulează cleanup_mock_patients.sql pentru a șterge datele mock
--
-- Toți pacienții mock au: Notes = '##MOCK_TEST##'
-- PatientCode format: MOCK000001 ... MOCK010000
-- CNP format mock: 0000009000001 ... 0000009010000 (nu reale ANAF)
--
-- Backup creat automat: Patients_Backup_<YYYYMMDD> (înainte de seeding)
-- =============================================================================

SET NOCOUNT ON;

DECLARE @ClinicId   UNIQUEIDENTIFIER = 'a0000001-0000-0000-0000-000000000001';
DECLARE @CreatedBy  UNIQUEIDENTIFIER = '2c0780a7-8612-f111-bbb2-20235109a3a2';
DECLARE @Marker     NVARCHAR(50)     = N'##MOCK_TEST##';

-- ── 1. Backup tabelă (skip dacă există deja) ──────────────────────
DECLARE @BackupName NVARCHAR(128) = N'Patients_Backup_'
    + REPLACE(CONVERT(NVARCHAR(10), GETDATE(), 120), '-', '');
DECLARE @BackupSql NVARCHAR(512) = N'SELECT * INTO '
    + QUOTENAME(@BackupName) + N' FROM Patients';
IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = @BackupName
)
    EXEC sp_executesql @BackupSql;

-- ── 2. INSERT set-based 10.000 rânduri ────────────────────────────
;WITH Nums AS (
    -- 10x10x10x10 = exact 10.000 rânduri
    SELECT TOP 10000 ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS n
    FROM (VALUES(1),(1),(1),(1),(1),(1),(1),(1),(1),(1)) a(x)
    CROSS JOIN (VALUES(1),(1),(1),(1),(1),(1),(1),(1),(1),(1)) b(x)
    CROSS JOIN (VALUES(1),(1),(1),(1),(1),(1),(1),(1),(1),(1)) c(x)
    CROSS JOIN (VALUES(1),(1),(1),(1),(1),(1),(1),(1),(1),(1)) d(x)
)
INSERT INTO Patients (
    Id, ClinicId,
    FirstName, LastName,
    Cnp, BirthDate,
    GenderId, BloodTypeId,
    PhoneNumber, Email,
    City, County,
    IsInsured, IsActive, IsDeleted,
    Notes, PatientCode,
    CreatedAt, CreatedBy
)
SELECT
    NEWID(),
    @ClinicId,
    -- FirstName: 60% masculin (n%5 IN 0,1,4), 40% feminin
    CASE
        WHEN n % 5 IN (0,1,4) THEN
            CASE (n * 17 + 3) % 20
                WHEN 0  THEN N'Alexandru'  WHEN 1  THEN N'Andrei'
                WHEN 2  THEN N'Bogdan'     WHEN 3  THEN N'Cristian'
                WHEN 4  THEN N'Daniel'     WHEN 5  THEN N'Florin'
                WHEN 6  THEN N'Gabriel'    WHEN 7  THEN N'George'
                WHEN 8  THEN N'Ioan'       WHEN 9  THEN N'Ionuț'
                WHEN 10 THEN N'Lucian'     WHEN 11 THEN N'Marius'
                WHEN 12 THEN N'Mihai'      WHEN 13 THEN N'Nicolae'
                WHEN 14 THEN N'Paul'       WHEN 15 THEN N'Radu'
                WHEN 16 THEN N'Sorin'      WHEN 17 THEN N'Ștefan'
                WHEN 18 THEN N'Tudor'      ELSE        N'Vlad'
            END
        ELSE
            CASE (n * 13 + 7) % 15
                WHEN 0  THEN N'Adriana'    WHEN 1  THEN N'Alexandra'
                WHEN 2  THEN N'Alina'      WHEN 3  THEN N'Ana'
                WHEN 4  THEN N'Andreea'    WHEN 5  THEN N'Cristina'
                WHEN 6  THEN N'Diana'      WHEN 7  THEN N'Elena'
                WHEN 8  THEN N'Ioana'      WHEN 9  THEN N'Laura'
                WHEN 10 THEN N'Maria'      WHEN 11 THEN N'Monica'
                WHEN 12 THEN N'Raluca'     WHEN 13 THEN N'Simona'
                ELSE        N'Teodora'
            END
    END,
    -- LastName (20 opțiuni)
    CASE (n * 11 + 5) % 20
        WHEN 0  THEN N'Popescu'      WHEN 1  THEN N'Ionescu'
        WHEN 2  THEN N'Popa'         WHEN 3  THEN N'Radu'
        WHEN 4  THEN N'Dumitrescu'   WHEN 5  THEN N'Constantin'
        WHEN 6  THEN N'Gheorghe'     WHEN 7  THEN N'Stan'
        WHEN 8  THEN N'Florea'       WHEN 9  THEN N'Marin'
        WHEN 10 THEN N'Petrescu'     WHEN 11 THEN N'Cristea'
        WHEN 12 THEN N'Manole'       WHEN 13 THEN N'Vasile'
        WHEN 14 THEN N'Ungureanu'    WHEN 15 THEN N'Munteanu'
        WHEN 16 THEN N'Matei'        WHEN 17 THEN N'Barbu'
        WHEN 18 THEN N'Stoica'       ELSE        N'Lungu'
    END,
    -- CNP mock 13 cifre, unic (9000001–9010000)
    RIGHT('0000000000000' + CAST(9000000 + n AS NVARCHAR(13)), 13),
    -- BirthDate: distribuit între 1940 și 2005
    CAST(DATEADD(DAY, -((CAST(n AS BIGINT) * 7919 + 13) % 23725 + 365), GETDATE()) AS DATE),
    -- GenderId
    CASE WHEN n % 5 IN (0,1,4)
         THEN CAST('e0010001-0000-0000-0000-000000000001' AS UNIQUEIDENTIFIER)  -- Masculin
         ELSE CAST('e0010001-0000-0000-0000-000000000002' AS UNIQUEIDENTIFIER)  -- Feminin
    END,
    -- BloodTypeId (9% NULL)
    CASE WHEN n % 11 = 0 THEN NULL
         ELSE CAST(
             CASE n % 8
                 WHEN 0 THEN 'e0020001-0000-0000-0000-000000000001'  -- A+
                 WHEN 1 THEN 'e0020001-0000-0000-0000-000000000002'  -- A-
                 WHEN 2 THEN 'e0020001-0000-0000-0000-000000000003'  -- B+
                 WHEN 3 THEN 'e0020001-0000-0000-0000-000000000004'  -- B-
                 WHEN 4 THEN 'e0020001-0000-0000-0000-000000000005'  -- AB+
                 WHEN 5 THEN 'e0020001-0000-0000-0000-000000000006'  -- AB-
                 WHEN 6 THEN 'e0020001-0000-0000-0000-000000000007'  -- 0+
                 ELSE        'e0020001-0000-0000-0000-000000000008'  -- 0-
             END AS UNIQUEIDENTIFIER)
    END,
    -- PhoneNumber: 07XXXXXXXX (10 cifre)
    N'07' + RIGHT('00000000' + CAST(10000000 + n AS NVARCHAR(10)), 8),
    -- Email simplu fără diacritice
    N'patient' + CAST(n AS NVARCHAR(6)) + N'@mock.test',
    -- City (10 orașe principale)
    CASE (n * 7 + 11) % 10
        WHEN 0 THEN N'București'   WHEN 1 THEN N'Cluj-Napoca'
        WHEN 2 THEN N'Timișoara'   WHEN 3 THEN N'Iași'
        WHEN 4 THEN N'Constanța'   WHEN 5 THEN N'Brașov'
        WHEN 6 THEN N'Galați'      WHEN 7 THEN N'Craiova'
        WHEN 8 THEN N'Ploiești'    ELSE        N'Oradea'
    END,
    -- County
    CASE (n * 7 + 11) % 10
        WHEN 0 THEN N'Ilfov'        WHEN 1 THEN N'Cluj'
        WHEN 2 THEN N'Timiș'        WHEN 3 THEN N'Iași'
        WHEN 4 THEN N'Constanța'    WHEN 5 THEN N'Brașov'
        WHEN 6 THEN N'Galați'       WHEN 7 THEN N'Dolj'
        WHEN 8 THEN N'Prahova'      ELSE        N'Bihor'
    END,
    -- IsInsured: 70% da
    CAST(CASE WHEN n % 10 < 7 THEN 1 ELSE 0 END AS BIT),
    -- IsActive: 90% activi
    CAST(CASE WHEN n % 10 = 9 THEN 0 ELSE 1 END AS BIT),
    -- IsDeleted: 0
    CAST(0 AS BIT),
    -- Marker pentru cleanup
    @Marker,
    -- PatientCode mock (MOCK000001 – MOCK010000)
    N'MOCK' + RIGHT('000000' + CAST(n AS NVARCHAR(6)), 6),
    -- CreatedAt: distribuit pe ultimii 5 ani
    DATEADD(DAY, -(n % 1825), GETDATE()),
    @CreatedBy
FROM Nums;

-- ── 3. Raport final ───────────────────────────────────────────────
SELECT
    (SELECT COUNT(*) FROM Patients)                                               AS TotalPacienti,
    (SELECT COUNT(*) FROM Patients WHERE Notes = N'##MOCK_TEST##')                AS PacientiMock,
    (SELECT COUNT(*) FROM Patients WHERE Notes != N'##MOCK_TEST##' OR Notes IS NULL) AS PacientiReali;
