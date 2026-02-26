CREATE OR ALTER PROCEDURE dbo.Nomenclature_GetGenders
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT g.Id, g.Name, g.Code, g.IsActive
    FROM Genders g
    WHERE (@IsActive IS NULL OR g.IsActive = @IsActive)
    ORDER BY g.Name;
END;
GO
