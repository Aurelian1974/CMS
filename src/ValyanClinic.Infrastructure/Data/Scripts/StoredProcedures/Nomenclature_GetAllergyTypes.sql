CREATE OR ALTER PROCEDURE dbo.Nomenclature_GetAllergyTypes
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT at2.Id, at2.Name, at2.Code, at2.IsActive
    FROM AllergyTypes at2
    WHERE (@IsActive IS NULL OR at2.IsActive = @IsActive)
    ORDER BY at2.Name;
END;
GO
