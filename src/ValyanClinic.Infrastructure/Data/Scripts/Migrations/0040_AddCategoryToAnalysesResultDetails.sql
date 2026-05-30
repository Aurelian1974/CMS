-- ============================================================================
-- Migrare 0040: Adaugare coloane Category si Subcategory la AnalysesResultDetails
--
-- Scopul: Stocarea categoriei/subcategoriei din nomenclatorul de analize pe
--         fiecare linie de buletin, pentru vizualizare si grupare in interfata.
-- ============================================================================

SET NOCOUNT ON;
GO

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'AnalysesResultDetails' AND COLUMN_NAME = 'Category'
)
BEGIN
    ALTER TABLE dbo.AnalysesResultDetails
        ADD Category NVARCHAR(200) NULL;
    PRINT 'Coloana Category adaugata la AnalysesResultDetails.';
END
ELSE
    PRINT 'Coloana Category exista deja - ignorata.';
GO

IF NOT EXISTS (
    SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_NAME = 'AnalysesResultDetails' AND COLUMN_NAME = 'Subcategory'
)
BEGIN
    ALTER TABLE dbo.AnalysesResultDetails
        ADD Subcategory NVARCHAR(200) NULL;
    PRINT 'Coloana Subcategory adaugata la AnalysesResultDetails.';
END
ELSE
    PRINT 'Coloana Subcategory exista deja - ignorata.';
GO
