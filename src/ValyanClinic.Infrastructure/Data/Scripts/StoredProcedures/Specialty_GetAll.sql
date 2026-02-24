-- ============================================================================
-- SP: Specialty_GetAll — Returnează toate specializările (flat list)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Specialty_GetAll
    @IsActive BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT s.Id, s.ParentId, s.Name, s.Code, s.Description,
           s.DisplayOrder, s.Level, s.IsActive, s.CreatedAt, s.UpdatedAt,
           p.Name AS ParentName
    FROM Specialties s
    LEFT JOIN Specialties p ON p.Id = s.ParentId
    WHERE (@IsActive IS NULL OR s.IsActive = @IsActive)
    ORDER BY s.Level, s.DisplayOrder, s.Name;
END;
GO
