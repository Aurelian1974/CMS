CREATE OR ALTER PROCEDURE dbo.Permission_GetAllAccessLevels
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        al.Id,
        al.Code,
        al.Name,
        al.Level
    FROM AccessLevels al
    ORDER BY al.Level;
END;
GO
