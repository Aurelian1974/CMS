SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Analysis_Search (typeahead pentru recomandari)
-- Cauta in dictionarul Analyses dupa Name (LIKE), max 50 rezultate.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Analysis_Search
    @Query NVARCHAR(200),
    @Top   INT = 50
AS
BEGIN
    SET NOCOUNT ON;
    SELECT TOP (@Top)
        Id, Name, Category, Subcategory, Slug
    FROM dbo.Analyses
    WHERE Name LIKE '%' + @Query + '%'
       OR Slug LIKE '%' + @Query + '%'
    ORDER BY
        CASE WHEN Name LIKE @Query + '%' THEN 0 ELSE 1 END,
        LEN(Name),
        Name;
END;
GO
