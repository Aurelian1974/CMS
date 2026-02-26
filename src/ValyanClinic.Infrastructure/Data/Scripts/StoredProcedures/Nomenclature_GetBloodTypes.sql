CREATE OR ALTER PROCEDURE dbo.Nomenclature_GetBloodTypes
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT bt.Id, bt.Name, bt.Code, bt.IsActive
    FROM BloodTypes bt
    WHERE (@IsActive IS NULL OR bt.IsActive = @IsActive)
    ORDER BY bt.Name;
END;
GO
