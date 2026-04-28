-- ============================================================================
-- Migrare 0035: Refactor Consultations -- split per-tab tables
-- Faza 1: Anamneză + Examen Clinic
--
-- Pași:
--   1. Creare tabele noi: dbo.ConsultationAnamnesis, dbo.ConsultationExam
--      (relație 1:0..1 cu Consultations, FK = ConsultationId care e și PK)
--   2. Migrare date existente din Consultations -> tabelele noi
--      (doar rândurile care au cel puțin un câmp non-NULL)
--   3. DROP COLUMN pe coloanele migrate din Consultations
--      (cu DROP CONSTRAINT pentru DEFAULT-uri unde e cazul)
-- ============================================================================

SET NOCOUNT ON;
SET XACT_ABORT ON;
GO

-- ── 1.A. Tabel ConsultationAnamnesis ────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ConsultationAnamnesis')
BEGIN
    CREATE TABLE dbo.ConsultationAnamnesis (
        ConsultationId          UNIQUEIDENTIFIER NOT NULL,
        Motiv                   NVARCHAR(MAX)    NULL,
        IstoricMedicalPersonal  NVARCHAR(MAX)    NULL,
        TratamentAnterior       NVARCHAR(MAX)    NULL,
        IstoricBoalaActuala     NVARCHAR(MAX)    NULL,
        IstoricFamilial         NVARCHAR(MAX)    NULL,
        FactoriDeRisc           NVARCHAR(MAX)    NULL,
        AlergiiConsultatie      NVARCHAR(MAX)    NULL,
        UpdatedAt               DATETIME2(0)     NULL,
        UpdatedBy               UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_ConsultationAnamnesis        PRIMARY KEY (ConsultationId),
        CONSTRAINT FK_ConsultationAnamnesis_Consultation
            FOREIGN KEY (ConsultationId) REFERENCES dbo.Consultations(Id) ON DELETE CASCADE
    );
    PRINT 'Tabel ConsultationAnamnesis creat.';
END
ELSE
    PRINT 'Tabel ConsultationAnamnesis există deja — ignorat.';
GO

-- ── 1.B. Tabel ConsultationExam ─────────────────────────────────────────────
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'ConsultationExam')
BEGIN
    CREATE TABLE dbo.ConsultationExam (
        ConsultationId          UNIQUEIDENTIFIER NOT NULL,
        StareGenerala           NVARCHAR(50)     NULL,
        Tegumente               NVARCHAR(50)     NULL,
        Mucoase                 NVARCHAR(50)     NULL,
        Greutate                DECIMAL(5,1)     NULL,
        Inaltime                INT              NULL,
        TensiuneSistolica       INT              NULL,
        TensiuneDiastolica      INT              NULL,
        Puls                    INT              NULL,
        FrecventaRespiratorie   INT              NULL,
        Temperatura             DECIMAL(4,1)     NULL,
        SpO2                    INT              NULL,
        Edeme                   NVARCHAR(50)     NULL,
        Glicemie                DECIMAL(6,1)     NULL,
        GanglioniLimfatici      NVARCHAR(100)    NULL,
        ExamenClinic            NVARCHAR(MAX)    NULL,
        AlteObservatiiClinice   NVARCHAR(MAX)    NULL,
        UpdatedAt               DATETIME2(0)     NULL,
        UpdatedBy               UNIQUEIDENTIFIER NULL,
        CONSTRAINT PK_ConsultationExam        PRIMARY KEY (ConsultationId),
        CONSTRAINT FK_ConsultationExam_Consultation
            FOREIGN KEY (ConsultationId) REFERENCES dbo.Consultations(Id) ON DELETE CASCADE
    );
    PRINT 'Tabel ConsultationExam creat.';
END
ELSE
    PRINT 'Tabel ConsultationExam există deja — ignorat.';
GO

-- ── 2.A. Migrare date Anamneză ──────────────────────────────────────────────
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='Motiv')
BEGIN
    INSERT INTO dbo.ConsultationAnamnesis (
        ConsultationId, Motiv, IstoricMedicalPersonal, TratamentAnterior,
        IstoricBoalaActuala, IstoricFamilial, FactoriDeRisc, AlergiiConsultatie,
        UpdatedAt, UpdatedBy)
    SELECT
        c.Id,
        c.Motiv,
        c.IstoricMedicalPersonal,
        c.TratamentAnterior,
        c.IstoricBoalaActuala,
        c.IstoricFamilial,
        c.FactoriDeRisc,
        c.AlergiiConsultatie,
        c.UpdatedAt,
        c.UpdatedBy
    FROM dbo.Consultations c
    WHERE NOT EXISTS (SELECT 1 FROM dbo.ConsultationAnamnesis a WHERE a.ConsultationId = c.Id)
      AND (
            c.Motiv                  IS NOT NULL OR
            c.IstoricMedicalPersonal IS NOT NULL OR
            c.TratamentAnterior      IS NOT NULL OR
            c.IstoricBoalaActuala    IS NOT NULL OR
            c.IstoricFamilial        IS NOT NULL OR
            c.FactoriDeRisc          IS NOT NULL OR
            c.AlergiiConsultatie     IS NOT NULL
          );
    PRINT CONCAT('Migrate ', @@ROWCOUNT, ' rânduri în ConsultationAnamnesis.');
END
GO

-- ── 2.B. Migrare date Examen Clinic ─────────────────────────────────────────
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='Consultations' AND COLUMN_NAME='StareGenerala')
BEGIN
    INSERT INTO dbo.ConsultationExam (
        ConsultationId, StareGenerala, Tegumente, Mucoase,
        Greutate, Inaltime,
        TensiuneSistolica, TensiuneDiastolica, Puls, FrecventaRespiratorie,
        Temperatura, SpO2, Edeme, Glicemie, GanglioniLimfatici,
        ExamenClinic, AlteObservatiiClinice,
        UpdatedAt, UpdatedBy)
    SELECT
        c.Id,
        c.StareGenerala,
        c.Tegumente,
        c.Mucoase,
        c.Greutate,
        c.Inaltime,
        c.TensiuneSistolica,
        c.TensiuneDiastolica,
        c.Puls,
        c.FrecventaRespiratorie,
        c.Temperatura,
        c.SpO2,
        c.Edeme,
        c.Glicemie,
        c.GanglioniLimfatici,
        c.ExamenClinic,
        c.AlteObservatiiClinice,
        c.UpdatedAt,
        c.UpdatedBy
    FROM dbo.Consultations c
    WHERE NOT EXISTS (SELECT 1 FROM dbo.ConsultationExam e WHERE e.ConsultationId = c.Id)
      AND (
            c.StareGenerala         IS NOT NULL OR
            c.Tegumente             IS NOT NULL OR
            c.Mucoase               IS NOT NULL OR
            c.Greutate              IS NOT NULL OR
            c.Inaltime              IS NOT NULL OR
            c.TensiuneSistolica     IS NOT NULL OR
            c.TensiuneDiastolica    IS NOT NULL OR
            c.Puls                  IS NOT NULL OR
            c.FrecventaRespiratorie IS NOT NULL OR
            c.Temperatura           IS NOT NULL OR
            c.SpO2                  IS NOT NULL OR
            c.Edeme                 IS NOT NULL OR
            c.Glicemie              IS NOT NULL OR
            c.GanglioniLimfatici    IS NOT NULL OR
            c.ExamenClinic          IS NOT NULL OR
            c.AlteObservatiiClinice IS NOT NULL
          );
    PRINT CONCAT('Migrate ', @@ROWCOUNT, ' rânduri în ConsultationExam.');
END
GO

-- ── 3. DROP COLUMN-uri vechi ────────────────────────────────────────────────
-- Helper: drop column dacă există (cu drop default constraint dacă e cazul)
DECLARE @sql NVARCHAR(MAX);

DECLARE @colsToDrop TABLE (ColName SYSNAME);
INSERT INTO @colsToDrop (ColName) VALUES
    -- Anamneză
    ('Motiv'),
    ('IstoricMedicalPersonal'),
    ('TratamentAnterior'),
    ('IstoricBoalaActuala'),
    ('IstoricFamilial'),
    ('FactoriDeRisc'),
    ('AlergiiConsultatie'),
    -- Examen Clinic
    ('StareGenerala'),
    ('Tegumente'),
    ('Mucoase'),
    ('Greutate'),
    ('Inaltime'),
    ('TensiuneSistolica'),
    ('TensiuneDiastolica'),
    ('Puls'),
    ('FrecventaRespiratorie'),
    ('Temperatura'),
    ('SpO2'),
    ('Edeme'),
    ('Glicemie'),
    ('GanglioniLimfatici'),
    ('ExamenClinic'),
    ('AlteObservatiiClinice');

DECLARE @col SYSNAME, @defName SYSNAME;
DECLARE col_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT ColName FROM @colsToDrop;
OPEN col_cursor;
FETCH NEXT FROM col_cursor INTO @col;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_NAME='Consultations' AND COLUMN_NAME=@col)
    BEGIN
        -- DROP DEFAULT CONSTRAINT dacă există
        SELECT @defName = dc.name
        FROM sys.default_constraints dc
        INNER JOIN sys.columns c ON c.default_object_id = dc.object_id
        WHERE dc.parent_object_id = OBJECT_ID('dbo.Consultations')
          AND c.name = @col;

        IF @defName IS NOT NULL
        BEGIN
            SET @sql = N'ALTER TABLE dbo.Consultations DROP CONSTRAINT ' + QUOTENAME(@defName) + N';';
            EXEC sp_executesql @sql;
            SET @defName = NULL;
        END

        SET @sql = N'ALTER TABLE dbo.Consultations DROP COLUMN ' + QUOTENAME(@col) + N';';
        EXEC sp_executesql @sql;
        PRINT CONCAT('Coloana ', @col, ' eliminată din Consultations.');
    END
    FETCH NEXT FROM col_cursor INTO @col;
END
CLOSE col_cursor;
DEALLOCATE col_cursor;
GO

PRINT 'Migrare 0035 (Faza 1: Anamneza + Exam) completă.';
GO
