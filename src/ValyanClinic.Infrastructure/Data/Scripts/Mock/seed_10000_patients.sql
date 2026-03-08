-- =============================================================================
-- SEED MOCK: 10.000 pacienți pentru testare performanță
--
-- INSTRUCȚIUNI:
--   1. Rulează acest script (tot blocul, fără GO-uri — e un singur batch)
--   2. Testează aplicația (paginare, filtrare, sortare, performanță)
--   3. Rulează cleanup_mock_patients.sql pentru a șterge datele mock
--
-- Toți pacienții mock au Notes = '##MOCK_TEST##' — marker pentru cleanup.
-- INSERT set-based (un singur statement) — inserare aproape instantă.
-- =============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;

-- ── Constante ────────────────────────────────────────────────────────────────
DECLARE @ClinicId    UNIQUEIDENTIFIER = 'a0000001-0000-0000-0000-000000000001';
DECLARE @CreatedBy   UNIQUEIDENTIFIER = '2c0780a7-8612-f111-bbb2-20235109a3a2';
DECLARE @MockMarker  NVARCHAR(50)     = N'##MOCK_TEST##';

-- ID-uri gender
DECLARE @GenderM UNIQUEIDENTIFIER = 'e0010001-0000-0000-0000-000000000001'; -- Masculin
DECLARE @GenderF UNIQUEIDENTIFIER = 'e0010001-0000-0000-0000-000000000002'; -- Feminin
DECLARE @GenderN UNIQUEIDENTIFIER = 'e0010001-0000-0000-0000-000000000003'; -- Nespecificat

-- ID-uri grupe sanguine
DECLARE @BT_Ap  UNIQUEIDENTIFIER = 'e0020001-0000-0000-0000-000000000001'; -- A+
DECLARE @BT_Am  UNIQUEIDENTIFIER = 'e0020001-0000-0000-0000-000000000002'; -- A-
DECLARE @BT_Bp  UNIQUEIDENTIFIER = 'e0020001-0000-0000-0000-000000000003'; -- B+
DECLARE @BT_Bm  UNIQUEIDENTIFIER = 'e0020001-0000-0000-0000-000000000004'; -- B-
DECLARE @BT_ABp UNIQUEIDENTIFIER = 'e0020001-0000-0000-0000-000000000005'; -- AB+
DECLARE @BT_ABm UNIQUEIDENTIFIER = 'e0020001-0000-0000-0000-000000000006'; -- AB-
DECLARE @BT_0p  UNIQUEIDENTIFIER = 'e0020001-0000-0000-0000-000000000007'; -- 0+
DECLARE @BT_0m  UNIQUEIDENTIFIER = 'e0020001-0000-0000-0000-000000000008'; -- 0-

-- ── Backup tabela Patients ── (tabel separat, nu SELECT INTO pentru a nu ocupa spatiu inutil)
-- Backup-ul se face în tabelul Patients_Backup_<data>
DECLARE @BackupTable NVARCHAR(128) = N'Patients_Backup_' + REPLACE(CONVERT(NVARCHAR(10), GETDATE(), 120), '-', '');

IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = @BackupTable)
BEGIN
    DECLARE @sql NVARCHAR(MAX) = N'SELECT * INTO ' + QUOTENAME(@BackupTable) + N' FROM Patients';
    EXEC sp_executesql @sql;
    PRINT 'Backup creat: ' + @BackupTable;
END
ELSE
BEGIN
    PRINT 'Backup exista deja: ' + @BackupTable + ' — skip.';
END;
GO

-- ── Arrays simulați prin tabele temporare ────────────────────────────────────
-- Prenume masculine
CREATE TABLE #FirstNamesM (Id INT IDENTITY(1,1), Name NVARCHAR(50));
INSERT INTO #FirstNamesM (Name) VALUES
(N'Alexandru'),(N'Andrei'),(N'Bogdan'),(N'Călin'),(N'Ciprian'),
(N'Constantin'),(N'Cristian'),(N'Daniel'),(N'David'),(N'Dragoș'),
(N'Emil'),(N'Florin'),(N'Gabriel'),(N'George'),(N'Gheorghe'),
(N'Horia'),(N'Iancu'),(N'Ioan'),(N'Ion'),(N'Ionuț'),
(N'Iulian'),(N'Liviu'),(N'Lucian'),(N'Marius'),(N'Mihai'),
(N'Mihail'),(N'Mircea'),(N'Nicolae'),(N'Octavian'),(N'Ovidiu'),
(N'Paul'),(N'Petru'),(N'Radu'),(N'Răzvan'),(N'Robert'),
(N'Romulus'),(N'Sebastian'),(N'Silviu'),(N'Sorin'),(N'Ștefan'),
(N'Teodor'),(N'Tiberiu'),(N'Tudor'),(N'Valentin'),(N'Vasile'),
(N'Victor'),(N'Vlad'),(N'Viorel'),(N'Virgil'),(N'Zaharia');

-- Prenume feminine
CREATE TABLE #FirstNamesF (Id INT IDENTITY(1,1), Name NVARCHAR(50));
INSERT INTO #FirstNamesF (Name) VALUES
(N'Adriana'),(N'Alexandra'),(N'Alice'),(N'Alina'),(N'Ana'),
(N'Andreea'),(N'Bianca'),(N'Carmen'),(N'Cătălina'),(N'Claudia'),
(N'Cosmina'),(N'Cristina'),(N'Dana'),(N'Diana'),(N'Elena'),
(N'Elisabeta'),(N'Florentina'),(N'Gabriela'),(N'Georgiana'),(N'Ioana'),
(N'Irina'),(N'Laura'),(N'Larisa'),(N'Lidia'),(N'Liliana'),
(N'Loredana'),(N'Luminița'),(N'Maria'),(N'Monica'),(N'Nicoleta'),
(N'Oana'),(N'Petra'),(N'Raluca'),(N'Ramona'),(N'Rodica'),
(N'Roxana'),(N'Simona'),(N'Sorina'),(N'Ștefania'),(N'Teodora'),
(N'Valentina'),(N'Veronica'),(N'Victoria'),(N'Violeta'),(N'Viorica'),
(N'Anca'),(N'Corina'),(N'Lavinia'),(N'Mirela'),(N'Nadia');

-- Nume de familie
CREATE TABLE #LastNames (Id INT IDENTITY(1,1), Name NVARCHAR(50));
INSERT INTO #LastNames (Name) VALUES
(N'Alexandrescu'),(N'Andrei'),(N'Antonescu'),(N'Apostol'),(N'Avram'),
(N'Badea'),(N'Bălan'),(N'Barbu'),(N'Bocșe'),(N'Boldea'),
(N'Bostan'),(N'Bratu'),(N'Bucur'),(N'Câmpeanu'),(N'Chiriță'),
(N'Ciobanu'),(N'Ciocan'),(N'Coman'),(N'Constantin'),(N'Costache'),
(N'Cristea'),(N'Dănilă'),(N'David'),(N'Diaconu'),(N'Dima'),
(N'Dinescu'),(N'Dobre'),(N'Dobrovolschi'),(N'Drăgan'),(N'Drăghici'),
(N'Dumitrescu'),(N'Dumitriu'),(N'Florescu'),(N'Florea'),(N'Gavrilă'),
(N'Gheorghe'),(N'Gheorghiu'),(N'Ghiță'),(N'Goga'),(N'Grecu'),
(N'Grigorescu'),(N'Iancu'),(N'Iftime'),(N'Iliescu'),(N'Ionescu'),
(N'Ioniță'),(N'Luca'),(N'Lungu'),(N'Manole'),(N'Marinescu'),
(N'Matei'),(N'Mihai'),(N'Mihăescu'),(N'Mocanu'),(N'Munteanu'),
(N'Neagu'),(N'Neculai'),(N'Negru'),(N'Niculescu'),(N'Oancea'),
(N'Olaru'),(N'Olteanu'),(N'Oprea'),(N'Pană'),(N'Pavel'),
(N'Petre'),(N'Petrescu'),(N'Pop'),(N'Popa'),(N'Popescu'),
(N'Predescu'),(N'Preda'),(N'Radu'),(N'Rotaru'),(N'Rusu'),
(N'Sandu'),(N'Sava'),(N'Simion'),(N'Stancu'),(N'Stan'),
(N'Stănescu'),(N'Șerbănescu'),(N'Ștefan'),(N'Tănase'),(N'Toma'),
(N'Tudor'),(N'Tudorache'),(N'Ungureanu'),(N'Vasilescu'),(N'Vasile'),
(N'Vlad'),(N'Vlădescu'),(N'Voicu'),(N'Zamfir'),(N'Zaharia'),
(N'Manea'),(N'Miron'),(N'Nistor'),(N'Sabău'),(N'Trifan');

-- Orașe
CREATE TABLE #Cities (Id INT IDENTITY(1,1), City NVARCHAR(100), County NVARCHAR(100));
INSERT INTO #Cities (City, County) VALUES
(N'București', N'Ilfov'),(N'București', N'Ilfov'),(N'București', N'Ilfov'),
(N'Cluj-Napoca', N'Cluj'),(N'Cluj-Napoca', N'Cluj'),
(N'Timișoara', N'Timiș'),(N'Timișoara', N'Timiș'),
(N'Iași', N'Iași'),(N'Iași', N'Iași'),
(N'Constanța', N'Constanța'),(N'Brașov', N'Brașov'),
(N'Galați', N'Galați'),(N'Craiova', N'Dolj'),
(N'Ploiești', N'Prahova'),(N'Oradea', N'Bihor'),
(N'Bacău', N'Bacău'),(N'Arad', N'Arad'),
(N'Pitești', N'Argeș'),(N'Sibiu', N'Sibiu'),
(N'Târgu Mureș', N'Mureș'),(N'Baia Mare', N'Maramureș'),
(N'Buzău', N'Buzău'),(N'Râmnicu Vâlcea', N'Vâlcea'),
(N'Satu Mare', N'Satu Mare'),(N'Suceava', N'Suceava'),
(N'Drobeta-Turnu Severin', N'Mehedinți'),(N'Focșani', N'Vrancea'),
(N'Târgoviște', N'Dâmbovița'),(N'Tulcea', N'Tulcea'),
(N'Deva', N'Hunedoara'),(N'Reșița', N'Caraș-Severin');

-- ID-uri grupe sanguine (tabel pentru selecție aleatorie)
CREATE TABLE #BloodTypes (Id INT IDENTITY(1,1), BtId UNIQUEIDENTIFIER);
INSERT INTO #BloodTypes (BtId) VALUES
('e0020001-0000-0000-0000-000000000001'),
('e0020001-0000-0000-0000-000000000002'),
('e0020001-0000-0000-0000-000000000003'),
('e0020001-0000-0000-0000-000000000004'),
('e0020001-0000-0000-0000-000000000005'),
('e0020001-0000-0000-0000-000000000006'),
('e0020001-0000-0000-0000-000000000007'),
('e0020001-0000-0000-0000-000000000008');

DECLARE @CountM     INT = (SELECT COUNT(*) FROM #FirstNamesM);
DECLARE @CountF     INT = (SELECT COUNT(*) FROM #FirstNamesF);
DECLARE @CountLN    INT = (SELECT COUNT(*) FROM #LastNames);
DECLARE @CountCity  INT = (SELECT COUNT(*) FROM #Cities);
DECLARE @CountBT    INT = (SELECT COUNT(*) FROM #BloodTypes);

DECLARE @ClinicId2   UNIQUEIDENTIFIER = 'a0000001-0000-0000-0000-000000000001';
DECLARE @CreatedBy2  UNIQUEIDENTIFIER = '2c0780a7-8612-f111-bbb2-20235109a3a2';
DECLARE @MockMarker2 NVARCHAR(50)     = N'##MOCK_TEST##';

-- ── Generare 10.000 pacienti mock ────────────────────────────────────────────
DECLARE @i         INT = 1;
DECLARE @Total     INT = 10000;
DECLARE @BatchSize INT = 500;   -- insert în batch-uri de 500 pentru performanță

-- Tabel staging pentru batch insert
CREATE TABLE #Batch (
    Id              UNIQUEIDENTIFIER,
    ClinicId        UNIQUEIDENTIFIER,
    FirstName       NVARCHAR(100),
    LastName        NVARCHAR(100),
    Cnp             NCHAR(13),
    BirthDate       DATE,
    GenderId        UNIQUEIDENTIFIER,
    BloodTypeId     UNIQUEIDENTIFIER,
    PhoneNumber     NVARCHAR(20),
    Email           NVARCHAR(200),
    City            NVARCHAR(100),
    County          NVARCHAR(100),
    IsInsured       BIT,
    IsActive        BIT,
    Notes           NVARCHAR(MAX),
    PatientCode     NVARCHAR(20),
    CreatedAt       DATETIME2,
    CreatedBy       UNIQUEIDENTIFIER
);

DECLARE @fnIdxM  INT, @fnIdxF INT, @lnIdx INT, @cityIdx INT, @btIdx INT;
DECLARE @genderInt INT;
DECLARE @genderId UNIQUEIDENTIFIER;
DECLARE @firstName NVARCHAR(50), @lastName NVARCHAR(50);
DECLARE @birthYear INT, @birthMonth INT, @birthDay INT;
DECLARE @birthDate DATE;
DECLARE @cnp NCHAR(13);
DECLARE @phone NVARCHAR(20);
DECLARE @email NVARCHAR(200);
DECLARE @city NVARCHAR(100), @county NVARCHAR(100);
DECLARE @btId UNIQUEIDENTIFIER;
DECLARE @isInsured BIT;
DECLARE @isActive BIT;
DECLARE @seq INT;
DECLARE @createdDate DATETIME2;

WHILE @i <= @Total
BEGIN
    -- Index aleatoriu bazat pe @i + noise
    SET @fnIdxM  = (@i * 17 + 3)  % @CountM  + 1;
    SET @fnIdxF  = (@i * 13 + 7)  % @CountF  + 1;
    SET @lnIdx   = (@i * 11 + 5)  % @CountLN + 1;
    SET @cityIdx = (@i * 7  + 11) % @CountCity + 1;
    SET @btIdx   = (@i * 3  + 2)  % @CountBT + 1;

    -- Gen: alternare cu variații (60% M, 40% F)
    SET @genderInt = CASE WHEN (@i % 5) IN (0, 1, 4) THEN 1 ELSE 2 END;

    IF @genderInt = 1
    BEGIN
        SET @genderId  = 'e0010001-0000-0000-0000-000000000001';
        SET @firstName = (SELECT Name FROM #FirstNamesM WHERE Id = @fnIdxM);
    END
    ELSE
    BEGIN
        SET @genderId  = 'e0010001-0000-0000-0000-000000000002';
        SET @firstName = (SELECT Name FROM #FirstNamesF WHERE Id = @fnIdxF);
    END;

    SET @lastName  = (SELECT Name FROM #LastNames WHERE Id = @lnIdx);
    SET @city      = (SELECT City FROM #Cities WHERE Id = @cityIdx);
    SET @county    = (SELECT County FROM #Cities WHERE Id = @cityIdx);
    SET @btId      = CASE WHEN (@i % 11) = 0 THEN NULL
                          ELSE (SELECT BtId FROM #BloodTypes WHERE Id = @btIdx)
                     END;

    -- Dată naștere: între 1940 și 2005
    SET @birthYear  = 1940 + (@i * 17 + @lnIdx) % 66;
    SET @birthMonth = (@i * 7  + 1) % 12 + 1;
    SET @birthDay   = (@i * 3  + 1) % 28 + 1;
    SET @birthDate  = TRY_CAST(CAST(@birthYear AS NVARCHAR(4)) + '-'
                    + RIGHT('0' + CAST(@birthMonth AS NVARCHAR(2)), 2) + '-'
                    + RIGHT('0' + CAST(@birthDay AS NVARCHAR(2)), 2) AS DATE);

    -- CNP mock (13 caractere, nu valid ANAF, unic pe @i)
    SET @cnp = RIGHT('0000000000000' + CAST(9000000 + @i AS NVARCHAR(13)), 13);

    -- Telefon
    SET @phone = '07' + RIGHT('00000000' + CAST(10000000 + @i AS NVARCHAR(10)), 8);

    -- Email
    SET @email = LOWER(REPLACE(@firstName, N'ă', N'a'));
    SET @email = REPLACE(@email, N'â', N'a');
    SET @email = REPLACE(@email, N'î', N'i');
    SET @email = REPLACE(@email, N'ș', N's');
    SET @email = REPLACE(@email, N'ț', N't');
    SET @email = @email + '.' + LOWER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(@lastName, N'ă', N'a'), N'â', N'a'), N'î', N'i'), N'ș', N's'), N'ț', N't'));
    SET @email = @email + CAST(@i AS NVARCHAR(6)) + N'@mock.test';

    -- IsInsured: 70% da
    SET @isInsured = CASE WHEN (@i % 10) < 7 THEN 1 ELSE 0 END;

    -- IsActive: 90% activi
    SET @isActive = CASE WHEN (@i % 10) = 0 THEN 0 ELSE 1 END;

    -- PatientCode
    SET @seq = @i;
    -- Data creare etalata pe ultimii 5 ani
    SET @createdDate = DATEADD(DAY, -(@i % 1825), GETDATE());

    INSERT INTO #Batch (Id, ClinicId, FirstName, LastName, Cnp, BirthDate,
                        GenderId, BloodTypeId, PhoneNumber, Email, City, County,
                        IsInsured, IsActive, Notes, PatientCode, CreatedAt, CreatedBy)
    VALUES (
        NEWID(),
        @ClinicId2,
        @firstName,
        @lastName,
        @cnp,
        @birthDate,
        @genderId,
        @btId,
        @phone,
        @email,
        @city,
        @county,
        @isInsured,
        @isActive,
        @MockMarker2,
        N'MOCK' + RIGHT('000000' + CAST(@seq AS NVARCHAR(6)), 6),
        @createdDate,
        @CreatedBy2
    );

    -- Flush batch la fiecare @BatchSize înregistrări sau la final
    IF (@i % @BatchSize = 0) OR (@i = @Total)
    BEGIN
        INSERT INTO Patients (Id, ClinicId, FirstName, LastName, Cnp, BirthDate,
                              GenderId, BloodTypeId, PhoneNumber, Email, City, County,
                              IsInsured, IsActive, Notes, PatientCode, CreatedAt, CreatedBy)
        SELECT Id, ClinicId, FirstName, LastName, Cnp, BirthDate,
               GenderId, BloodTypeId, PhoneNumber, Email, City, County,
               IsInsured, IsActive, Notes, PatientCode, CreatedAt, CreatedBy
        FROM #Batch;

        DELETE FROM #Batch;
        PRINT 'Inserat pana la: ' + CAST(@i AS NVARCHAR(10));
    END;

    SET @i = @i + 1;
END;

-- Cleanup tabele temporare
DROP TABLE #FirstNamesM;
DROP TABLE #FirstNamesF;
DROP TABLE #LastNames;
DROP TABLE #Cities;
DROP TABLE #BloodTypes;
DROP TABLE #Batch;

SELECT COUNT(*) AS TotalPacientiDupaSeeding FROM Patients;
SELECT COUNT(*) AS PacientiMock FROM Patients WHERE Notes = N'##MOCK_TEST##';
PRINT 'Seeding complet!';
GO
