-- ============================================================================
-- SP: Specialty_GetById — Returnează o specializare cu detalii
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Specialty_GetById
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT s.Id, s.ParentId, s.Name, s.Code, s.Description,
           s.DisplayOrder, s.Level, s.IsActive, s.CreatedAt, s.UpdatedAt,
           p.Name AS ParentName
    FROM Specialties s
    LEFT JOIN Specialties p ON p.Id = s.ParentId
    WHERE s.Id = @Id;
END;
GO
