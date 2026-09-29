SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: InvestigationType_GetImportable
-- Toate tipurile de investigații active și facturabile, cu serviciul deja legat în
-- tarifele clinicii (dacă există). Doar tipurile fără serviciu se pot importa;
-- un serviciu inactiv ține tipul ocupat — se reactivează, nu se reimportă.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.InvestigationType_GetImportable
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT d.TypeCode, d.DisplayName, d.Category, d.ParentTab, d.SortOrder,
           ex.Code AS ExistingServiceCode, ex.IsActive AS ExistingServiceIsActive
    FROM dbo.InvestigationTypeDefinitions d
    OUTER APPLY (
        SELECT TOP (1) ms.Code, ms.IsActive
        FROM dbo.MedicalServices ms
        WHERE ms.ClinicId = @ClinicId
          AND ms.IsDeleted = 0
          AND ms.InvestigationTypeCode = d.TypeCode
        ORDER BY ms.IsActive DESC, ms.CreatedAt
    ) ex
    WHERE d.IsActive = 1
      AND d.IsBillable = 1
    ORDER BY d.ParentTab, d.SortOrder, d.DisplayName;
END;
GO
