-- ============================================================================
-- Migrare 0033: Redenumire SynevoAnalyses -> Analize + eliminare coloane
-- Descriere: Redenumeste tabelul si elimina coloanele Price si SynevoUrl
-- Data: 2026-04-13
-- ============================================================================

SET NOCOUNT ON;
GO

-- Redenumire tabel
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'SynevoAnalyses')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Analize')
BEGIN
    EXEC sp_rename 'dbo.SynevoAnalyses', 'Analize';
    PRINT 'Tabel SynevoAnalyses redenumit in Analize.';
END
GO

-- Eliminare coloana Price
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Analize' AND COLUMN_NAME = 'Price')
BEGIN
    ALTER TABLE dbo.Analize DROP COLUMN Price;
    PRINT 'Coloana Price eliminata.';
END
GO

-- Eliminare coloana SynevoUrl
IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Analize' AND COLUMN_NAME = 'SynevoUrl')
BEGIN
    ALTER TABLE dbo.Analize DROP COLUMN SynevoUrl;
    PRINT 'Coloana SynevoUrl eliminata.';
END
GO

-- Redenumire indexuri
IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SynevoAnalyses_Category' AND object_id = OBJECT_ID('dbo.Analize'))
BEGIN
    EXEC sp_rename N'dbo.Analize.IX_SynevoAnalyses_Category', N'IX_Analize_Category', N'INDEX';
    PRINT 'Index IX_SynevoAnalyses_Category redenumit in IX_Analize_Category.';
END
GO

IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_SynevoAnalyses_Slug' AND object_id = OBJECT_ID('dbo.Analize'))
BEGIN
    EXEC sp_rename N'dbo.Analize.IX_SynevoAnalyses_Slug', N'IX_Analize_Slug', N'INDEX';
    PRINT 'Index IX_SynevoAnalyses_Slug redenumit in IX_Analize_Slug.';
END
GO

-- Redenumire PK constraint
IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'PK_SynevoAnalyses' AND parent_object_id = OBJECT_ID('dbo.Analize'))
BEGIN
    EXEC sp_rename N'dbo.PK_SynevoAnalyses', N'PK_Analize', N'OBJECT';
    PRINT 'PK constraint redenumit in PK_Analize.';
END
GO
