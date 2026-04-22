-- ============================================================================
-- Migrare 0034: Redenumire Analize -> Analyses (conventie engleza)
-- Data: 2026-04-13
-- ============================================================================

SET NOCOUNT ON;
GO

IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Analize')
   AND NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'Analyses')
BEGIN
    EXEC sp_rename 'dbo.Analize', 'Analyses';

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Analize_Category' AND object_id = OBJECT_ID('dbo.Analyses'))
        EXEC sp_rename N'dbo.Analyses.IX_Analize_Category', N'IX_Analyses_Category', N'INDEX';

    IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Analize_Slug' AND object_id = OBJECT_ID('dbo.Analyses'))
        EXEC sp_rename N'dbo.Analyses.IX_Analize_Slug', N'IX_Analyses_Slug', N'INDEX';

    IF EXISTS (SELECT 1 FROM sys.key_constraints WHERE name = 'PK_Analize' AND parent_object_id = OBJECT_ID('dbo.Analyses'))
        EXEC sp_rename N'dbo.PK_Analize', N'PK_Analyses', N'OBJECT';

    PRINT 'Tabel Analize redenumit in Analyses.';
END
GO
