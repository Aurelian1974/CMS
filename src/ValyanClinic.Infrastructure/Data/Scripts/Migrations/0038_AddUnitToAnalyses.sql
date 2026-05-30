-- ============================================================================
-- Migrare 0038: Adaugare coloana Unit la dbo.Analyses
--
-- Scop:
--   Adauga coloana Unit (UM) la dictionarul de analize pentru a putea
--   returna unitatea de masura la cautarea unei analize in modulul
--   Analize Medicale (adaugare manuala).
-- ============================================================================

SET NOCOUNT ON;
GO

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'Analyses' AND COLUMN_NAME = 'Unit'
)
BEGIN
    ALTER TABLE dbo.Analyses
        ADD Unit NVARCHAR(50) NULL;

    PRINT 'Coloana Unit adaugata la dbo.Analyses.';
END
ELSE
BEGIN
    PRINT 'Coloana Unit exista deja la dbo.Analyses.';
END
GO
