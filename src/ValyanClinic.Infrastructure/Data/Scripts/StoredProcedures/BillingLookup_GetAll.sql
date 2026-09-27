SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: BillingLookup_GetAll
-- Nomenclatoarele modulului financiar într-un singur apel:
--   1) categorii servicii  2) regimuri TVA active  3) metode de plată
--   4) serii de facturi active ale clinicii
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.BillingLookup_GetAll
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT Id, Code, Name, SortOrder
    FROM dbo.ServiceCategories
    WHERE IsActive = 1
    ORDER BY SortOrder, Name;

    SELECT Id, Code, Name, [Percent], UblCategoryCode, ExemptionReasonCode, ExemptionReasonText, SortOrder
    FROM dbo.VatRates
    WHERE IsActive = 1
    ORDER BY SortOrder, Name;

    SELECT Id, Code, Name, RequiresFiscalReceipt, SortOrder
    FROM dbo.PaymentMethods
    WHERE IsActive = 1
    ORDER BY SortOrder, Name;

    SELECT Id, Series, LastNumber, IsDefault
    FROM dbo.InvoiceSeries
    WHERE ClinicId = @ClinicId AND IsActive = 1
    ORDER BY IsDefault DESC, Series;
END;
GO
