SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: VatRate_GetAll — toate regimurile TVA (inclusiv inactive, pentru administrare)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.VatRate_GetAll
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT v.Id, v.Code, v.Name, v.[Percent], v.UblCategoryCode,
           v.ExemptionReasonCode, v.ExemptionReasonText, v.SortOrder, v.IsActive,
           m.TaxGroup AS FiscalTaxGroup
    FROM dbo.VatRates v
    LEFT JOIN dbo.FiscalVatMappings m ON m.VatRateId = v.Id AND m.ClinicId = @ClinicId
    ORDER BY v.SortOrder, v.Name;
END;
GO
