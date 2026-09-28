-- ============================================================================
-- Migrare 0059: Hardening Consultations
-- Descriere: o singură consultație per programare (index unic), Diagnostic
--            lărgit la NVARCHAR(MAX), tabel normalizat ConsultationDiagnoses
--            (ICD-10) + backfill din JSON-ul existent, eliminare SP nefolosit.
-- ============================================================================

SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ── 1. De-duplicare AppointmentId ────────────────────────────────────────────
-- Păstrăm cea mai veche consultație per programare; celelalte rămân acte
-- medicale valide, doar fără legătura la programare (nu se șterge nimic).
;WITH Ranked AS (
    SELECT Id,
           ROW_NUMBER() OVER (PARTITION BY AppointmentId ORDER BY CreatedAt ASC, Id ASC) AS rn
    FROM dbo.Consultations
    WHERE AppointmentId IS NOT NULL AND IsDeleted = 0
)
UPDATE c SET AppointmentId = NULL
FROM dbo.Consultations c
INNER JOIN Ranked r ON r.Id = c.Id
WHERE r.rn > 1;
GO

IF EXISTS (SELECT 1 FROM sys.indexes
           WHERE name = 'IX_Consultations_AppointmentId' AND object_id = OBJECT_ID('dbo.Consultations'))
    DROP INDEX IX_Consultations_AppointmentId ON dbo.Consultations;
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = 'UX_Consultations_AppointmentId' AND object_id = OBJECT_ID('dbo.Consultations'))
BEGIN
    CREATE UNIQUE NONCLUSTERED INDEX UX_Consultations_AppointmentId
        ON dbo.Consultations (AppointmentId)
        WHERE AppointmentId IS NOT NULL AND IsDeleted = 0;
    PRINT 'Index unic UX_Consultations_AppointmentId creat.';
END
GO

-- ── 2. Diagnostic → NVARCHAR(MAX) ────────────────────────────────────────────
-- Clientul salvează aici JSON-ul ICD-10 (cu rich-text); 4000 caractere dădeau eroarea 8152.
IF EXISTS (SELECT 1 FROM sys.columns
           WHERE object_id = OBJECT_ID('dbo.Consultations') AND name = 'Diagnostic' AND max_length <> -1)
BEGIN
    ALTER TABLE dbo.Consultations ALTER COLUMN Diagnostic NVARCHAR(MAX) NULL;
    PRINT 'Coloana Consultations.Diagnostic largita la NVARCHAR(MAX).';
END
GO

-- ── 3. Tabel ConsultationDiagnoses ───────────────────────────────────────────
-- Proiecție relațională a JSON-ului din Consultations.Diagnostic, rescrisă integral
-- la fiecare salvare (ConsultationDiagnosis_SyncFromJson). GroupNo: 0 = principal,
-- N = al N-lea diagnostic secundar (un grup poate avea mai multe coduri).
IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES
               WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = 'ConsultationDiagnoses')
BEGIN
    CREATE TABLE dbo.ConsultationDiagnoses (
        Id               UNIQUEIDENTIFIER NOT NULL DEFAULT NEWSEQUENTIALID(),
        ConsultationId   UNIQUEIDENTIFIER NOT NULL,
        ClinicId         UNIQUEIDENTIFIER NOT NULL,
        Icd10Code        NVARCHAR(20)     NOT NULL,
        -- Snapshot: actul medical rămâne citibil chiar dacă nomenclatorul se schimbă
        Icd10Description NVARCHAR(500)    NULL,
        IsPrimary        BIT              NOT NULL DEFAULT 0,
        GroupNo          INT              NOT NULL DEFAULT 0,
        Details          NVARCHAR(MAX)    NULL,
        SortOrder        INT              NOT NULL DEFAULT 0,
        CreatedAt        DATETIME2(0)     NOT NULL DEFAULT SYSDATETIME(),
        CreatedBy        UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_ConsultationDiagnoses PRIMARY KEY (Id),
        CONSTRAINT FK_ConsultationDiagnoses_Consultations
            FOREIGN KEY (ConsultationId) REFERENCES dbo.Consultations(Id) ON DELETE CASCADE,
        CONSTRAINT FK_ConsultationDiagnoses_Clinics
            FOREIGN KEY (ClinicId) REFERENCES dbo.Clinics(Id)
    );

    CREATE UNIQUE NONCLUSTERED INDEX UX_ConsultationDiagnoses_Primary
        ON dbo.ConsultationDiagnoses (ConsultationId) WHERE IsPrimary = 1;

    CREATE NONCLUSTERED INDEX IX_ConsultationDiagnoses_Consultation
        ON dbo.ConsultationDiagnoses (ConsultationId)
        INCLUDE (Icd10Code, Icd10Description, IsPrimary, SortOrder);

    CREATE NONCLUSTERED INDEX IX_ConsultationDiagnoses_ClinicId_Code
        ON dbo.ConsultationDiagnoses (ClinicId, Icd10Code)
        INCLUDE (ConsultationId, IsPrimary);

    PRINT 'Tabel ConsultationDiagnoses creat.';
END
GO

-- ── 4. Backfill din JSON ─────────────────────────────────────────────────────
-- Forma JSON (ConsultationsListPage): { primaryCode: ICD10SearchResult, primaryDetails,
-- secondaryDiagnoses: [{ id, description, icd10Codes: ICD10SearchResult[] }] }.
-- JSON_VALUE întoarce NULL peste 4000 caractere → textele lungi se citesc prin OPENJSON WITH.
-- CASE WHEN ISJSON: OPENJSON pe text liber aruncă eroare, iar WHERE nu garantează ordinea evaluării.
INSERT INTO dbo.ConsultationDiagnoses
    (ConsultationId, ClinicId, Icd10Code, Icd10Description, IsPrimary, GroupNo, Details, SortOrder, CreatedBy)
SELECT c.Id, c.ClinicId, j.Code, j.Descr, 1, 0, j.Details, 0, c.CreatedBy
FROM dbo.Consultations c
CROSS APPLY OPENJSON(CASE WHEN ISJSON(c.Diagnostic) = 1 THEN c.Diagnostic END) WITH (
    Code    NVARCHAR(20)  '$.primaryCode.code',
    Descr   NVARCHAR(500) '$.primaryCode.shortDescriptionRo',
    Details NVARCHAR(MAX) '$.primaryDetails') j
WHERE j.Code IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM dbo.ConsultationDiagnoses d WHERE d.ConsultationId = c.Id);
GO

INSERT INTO dbo.ConsultationDiagnoses
    (ConsultationId, ClinicId, Icd10Code, Icd10Description, IsPrimary, GroupNo, Details, SortOrder, CreatedBy)
SELECT c.Id, c.ClinicId, cc.Code, cc.Descr, 0,
       CAST(sec.[key] AS INT) + 1,
       CASE WHEN CAST(codes.[key] AS INT) = 0 THEN sd.Description END,
       ROW_NUMBER() OVER (PARTITION BY c.Id ORDER BY CAST(sec.[key] AS INT), CAST(codes.[key] AS INT)),
       c.CreatedBy
FROM dbo.Consultations c
CROSS APPLY OPENJSON(CASE WHEN ISJSON(c.Diagnostic) = 1 THEN c.Diagnostic END, '$.secondaryDiagnoses') sec
CROSS APPLY OPENJSON(CASE WHEN sec.type = 5 THEN sec.value END) WITH (
    Description NVARCHAR(MAX) '$.description',
    Icd10Codes  NVARCHAR(MAX) '$.icd10Codes' AS JSON) sd
CROSS APPLY OPENJSON(sd.Icd10Codes) codes
CROSS APPLY OPENJSON(CASE WHEN codes.type = 5 THEN codes.value END) WITH (
    Code  NVARCHAR(20)  '$.code',
    Descr NVARCHAR(500) '$.shortDescriptionRo') cc
WHERE cc.Code IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM dbo.ConsultationDiagnoses d
                  WHERE d.ConsultationId = c.Id AND d.IsPrimary = 0);
GO

-- ── 5. SP nefolosit ──────────────────────────────────────────────────────────
-- Istoricul pe pacient trece prin Consultation_GetPaged; SP-urile rulează cu
-- NullJournal, deci ștergerea fișierului nu-l elimină din bază.
DROP PROCEDURE IF EXISTS dbo.Consultation_GetByPatient;
GO

PRINT 'Migrarea 0059_ConsultationsHardening finalizata cu succes.';
GO
