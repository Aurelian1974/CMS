SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: InvestigationType_GetImportable
-- Tipurile de investigații facturabile care nu au încă un serviciu în tarifele clinicii.
-- Un serviciu inactiv ține în continuare tipul ocupat — se reactivează, nu se reimportă.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.InvestigationType_GetImportable
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT d.TypeCode, d.DisplayName, d.Category, d.ParentTab, d.SortOrder
    FROM dbo.InvestigationTypeDefinitions d
    WHERE d.IsActive = 1
      AND d.IsBillable = 1
      AND NOT EXISTS (
          SELECT 1 FROM dbo.MedicalServices ms
          WHERE ms.ClinicId = @ClinicId
            AND ms.IsDeleted = 0
            AND ms.InvestigationTypeCode = d.TypeCode)
    ORDER BY d.ParentTab, d.SortOrder, d.DisplayName;
END;
GO
