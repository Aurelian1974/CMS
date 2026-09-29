-- ============================================================
-- AdministrativePosition_GetAll — nomenclator funcții administrative
-- Nomenclator național (fără ClinicId): aceleași funcții pentru toate clinicile.
-- ============================================================
CREATE OR ALTER PROCEDURE dbo.AdministrativePosition_GetAll
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT Id, Name, Code, SortOrder, IsActive
    FROM dbo.AdministrativePositions
    WHERE (@IsActive IS NULL OR IsActive = @IsActive)
    ORDER BY SortOrder, Name;
END;
GO
