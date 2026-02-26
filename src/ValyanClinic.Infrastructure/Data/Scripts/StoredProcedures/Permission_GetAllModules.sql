CREATE OR ALTER PROCEDURE dbo.Permission_GetAllModules
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        m.Id,
        m.Code,
        m.Name,
        m.Description,
        m.SortOrder,
        m.IsActive
    FROM Modules m
    WHERE m.IsActive = 1
    ORDER BY m.SortOrder;
END;
GO
