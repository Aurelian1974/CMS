SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Analysis_GetAll
-- Returneaza tot dictionarul de analize, ordonat dupa Category, Subcategory, Name.
-- Folosit de AnalysisPicker (picker modal cu browse pe categorii).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Analysis_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        Id, Name, Category, Subcategory, Slug, Unit
    FROM dbo.Analyses
    ORDER BY
        ISNULL(Category, ''),
        ISNULL(Subcategory, ''),
        Name;
END;
GO
