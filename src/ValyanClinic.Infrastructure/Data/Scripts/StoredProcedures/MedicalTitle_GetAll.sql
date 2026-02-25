-- ============================================================================
-- SP: MedicalTitle_GetAll
-- Descriere: Returnează toate titularturile medicale, cu filtru opțional IsActive
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.MedicalTitle_GetAll
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        mt.Id,
        mt.Name,
        mt.Code,
        mt.Description,
        mt.DisplayOrder,
        mt.IsActive,
        mt.CreatedAt,
        mt.UpdatedAt
    FROM MedicalTitles mt
    WHERE (@IsActive IS NULL OR mt.IsActive = @IsActive)
    ORDER BY mt.DisplayOrder, mt.Name;
END;
GO
