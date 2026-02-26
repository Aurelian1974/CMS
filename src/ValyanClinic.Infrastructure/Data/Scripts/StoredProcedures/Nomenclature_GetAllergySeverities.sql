CREATE OR ALTER PROCEDURE dbo.Nomenclature_GetAllergySeverities
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT als.Id, als.Name, als.Code, als.IsActive
    FROM AllergySeverities als
    WHERE (@IsActive IS NULL OR als.IsActive = @IsActive)
    ORDER BY als.Name;
END;
GO
