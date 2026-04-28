SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: InvestigationType_GetAll
-- Returneaza toate tipurile active sortate dupa SortOrder.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.InvestigationType_GetAll
AS
BEGIN
    SET NOCOUNT ON;
    SELECT
        TypeCode, DisplayName, DisplayNameEn, Category, ParentTab, UIPattern,
        Specialties, HasStructuredFields, DefaultStructuredEntry,
        JsonSchemaVersion, IsActive, SortOrder
    FROM dbo.InvestigationTypeDefinitions
    WHERE IsActive = 1
    ORDER BY SortOrder, DisplayName;
END;
GO
