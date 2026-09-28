-- ============================================================================
-- ROLLBACK 0059 — rulat MANUAL (nu este preluat de DbUp).
-- Datele din ConsultationDiagnoses se pierd (sunt derivate din Consultations.Diagnostic).
-- După rollback, redeploy SP-urile Consultation_* din commit-ul anterior lui 0059.
-- ============================================================================
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

DROP PROCEDURE IF EXISTS dbo.Consultation_Finalize;
DROP PROCEDURE IF EXISTS dbo.ConsultationDiagnosis_SyncFromJson;
GO

IF OBJECT_ID('dbo.ConsultationDiagnoses', 'U') IS NOT NULL
    DROP TABLE dbo.ConsultationDiagnoses;
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'UX_Consultations_AppointmentId' AND object_id = OBJECT_ID('dbo.Consultations'))
    DROP INDEX UX_Consultations_AppointmentId ON dbo.Consultations;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Consultations_AppointmentId' AND object_id = OBJECT_ID('dbo.Consultations'))
    CREATE NONCLUSTERED INDEX IX_Consultations_AppointmentId
        ON dbo.Consultations (AppointmentId) WHERE AppointmentId IS NOT NULL;
GO

-- Îngustarea coloanei doar dacă nu trunchiază date existente
IF NOT EXISTS (SELECT 1 FROM dbo.Consultations WHERE LEN(Diagnostic) > 4000)
    ALTER TABLE dbo.Consultations ALTER COLUMN Diagnostic NVARCHAR(4000) NULL;
ELSE
    PRINT 'Diagnostic ramane NVARCHAR(MAX): exista randuri peste 4000 caractere.';
GO

DELETE FROM dbo.SchemaVersions WHERE ScriptName LIKE N'%0059_ConsultationsHardening.sql';
GO
