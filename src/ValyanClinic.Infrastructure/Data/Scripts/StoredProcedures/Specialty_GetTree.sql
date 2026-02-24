-- ============================================================================
-- SP: Specialty_GetTree — Returnează arborele ierarhic de specializări
--     Result set 1: Categorii (Level 0)
--     Result set 2: Specialități (Level 1) cu ParentId
--     Result set 3: Subspecialități (Level 2) cu ParentId
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Specialty_GetTree
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Categorii (Level 0)
    SELECT Id, ParentId, Name, Code, Description, DisplayOrder, Level, IsActive
    FROM Specialties
    WHERE Level = 0 AND (@IsActive IS NULL OR IsActive = @IsActive)
    ORDER BY DisplayOrder;

    -- Specialități (Level 1)
    SELECT Id, ParentId, Name, Code, Description, DisplayOrder, Level, IsActive
    FROM Specialties
    WHERE Level = 1 AND (@IsActive IS NULL OR IsActive = @IsActive)
    ORDER BY DisplayOrder, Name;

    -- Subspecialități (Level 2)
    SELECT Id, ParentId, Name, Code, Description, DisplayOrder, Level, IsActive
    FROM Specialties
    WHERE Level = 2 AND (@IsActive IS NULL OR IsActive = @IsActive)
    ORDER BY DisplayOrder, Name;
END;
GO
