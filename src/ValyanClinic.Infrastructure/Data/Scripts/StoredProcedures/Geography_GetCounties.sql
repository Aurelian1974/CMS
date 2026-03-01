-- ============================================================
-- Geography_GetCounties — lista tuturor județelor active
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.Geography_GetCounties
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        c.Id,
        c.Name,
        c.Abbreviation,
        c.SortOrder
    FROM Counties c
    WHERE c.IsActive = 1
    ORDER BY c.SortOrder, c.Name;
END;
GO
