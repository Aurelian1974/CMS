SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: InvestigationType_GetBySpecialty
-- Returneaza tipurile active care contin specialtatea data in CSV-ul Specialties.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.InvestigationType_GetBySpecialty
    @Specialty NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        TypeCode, DisplayName, DisplayNameEn, Category, ParentTab, UIPattern,
        Specialties, HasStructuredFields, DefaultStructuredEntry,
        JsonSchemaVersion, IsActive, SortOrder
    FROM dbo.InvestigationTypeDefinitions
    WHERE IsActive = 1
      AND (',' + Specialties + ',') LIKE ('%,' + @Specialty + ',%')
    ORDER BY SortOrder, DisplayName;
END;
GO
