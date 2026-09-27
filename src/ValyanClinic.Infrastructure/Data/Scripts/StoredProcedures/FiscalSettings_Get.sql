SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: FiscalSettings_Get — setările casei de marcat pentru clinică
-- Result sets: 1) setări (valori implicite dacă nu au fost salvate)
--              2) toate regimurile TVA active + grupa mapată
--              3) metodele de plată cu bon + codul aparatului mapat
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.FiscalSettings_Get
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        ISNULL(fs.IsEnabled, CAST(1 AS BIT))              AS IsEnabled,
        ISNULL(fs.BridgeUrl, N'http://127.0.0.1:5199')    AS BridgeUrl,
        c.IsVatPayer,
        fs.UpdatedAt
    FROM dbo.Clinics c
    LEFT JOIN dbo.FiscalSettings fs ON fs.ClinicId = c.Id
    WHERE c.Id = @ClinicId;

    SELECT v.Id AS VatRateId, v.Code AS VatRateCode, v.Name AS VatRateName, v.[Percent], m.TaxGroup
    FROM dbo.VatRates v
    LEFT JOIN dbo.FiscalVatMappings m ON m.VatRateId = v.Id AND m.ClinicId = @ClinicId
    WHERE v.IsActive = 1
    ORDER BY v.SortOrder, v.Name;

    SELECT pm.Id AS PaymentMethodId, pm.Code AS PaymentMethodCode, pm.Name AS PaymentMethodName, m.DevicePaymentCode
    FROM dbo.PaymentMethods pm
    LEFT JOIN dbo.FiscalPaymentMappings m ON m.PaymentMethodId = pm.Id AND m.ClinicId = @ClinicId
    WHERE pm.IsActive = 1 AND pm.RequiresFiscalReceipt = 1
    ORDER BY pm.SortOrder;
END;
GO
