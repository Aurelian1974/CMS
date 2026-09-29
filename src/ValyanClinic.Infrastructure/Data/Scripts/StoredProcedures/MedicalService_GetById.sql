SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: MedicalService_GetById — serviciul + istoricul complet al prețurilor
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.MedicalService_GetById
    @Id       UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    SELECT
        ms.Id, ms.Code, ms.Name, ms.CategoryId, sc.Name AS CategoryName,
        ms.DurationMinutes, ms.InvestigationTypeId, it.DisplayName AS InvestigationTypeName,
        ms.IsActive, ms.RowVersion, ms.CreatedAt, ms.UpdatedAt,
        cur.Price AS CurrentPrice, cur.VatRateId AS CurrentVatRateId, cv.Name AS CurrentVatRateName
    FROM dbo.MedicalServices ms
    INNER JOIN dbo.ServiceCategories sc ON sc.Id = ms.CategoryId
    LEFT JOIN dbo.InvestigationTypeDefinitions it ON it.Id = ms.InvestigationTypeId
    OUTER APPLY (
        SELECT TOP (1) p.Price, p.VatRateId
        FROM dbo.MedicalServicePrices p
        WHERE p.MedicalServiceId = ms.Id AND p.ValidFrom <= @Today
          AND (p.ValidTo IS NULL OR p.ValidTo > @Today)
        ORDER BY p.ValidFrom DESC
    ) cur
    LEFT JOIN dbo.VatRates cv ON cv.Id = cur.VatRateId
    WHERE ms.Id = @Id AND ms.ClinicId = @ClinicId AND ms.IsDeleted = 0;

    SELECT
        p.Id, p.Price, p.VatRateId, v.Name AS VatRateName, v.[Percent] AS VatPercent,
        p.ValidFrom, p.ValidTo, p.CreatedAt,
        CONCAT(u.LastName, N' ', u.FirstName) AS CreatedByName,
        CAST(CASE WHEN p.ValidFrom <= @Today AND (p.ValidTo IS NULL OR p.ValidTo > @Today)
                  THEN 1 ELSE 0 END AS BIT) AS IsCurrent
    FROM dbo.MedicalServicePrices p
    INNER JOIN dbo.MedicalServices ms ON ms.Id = p.MedicalServiceId AND ms.IsDeleted = 0
    INNER JOIN dbo.VatRates v ON v.Id = p.VatRateId
    LEFT JOIN dbo.Users u ON u.Id = p.CreatedBy
    WHERE p.MedicalServiceId = @Id AND ms.ClinicId = @ClinicId
    ORDER BY p.ValidFrom DESC;
END;
GO
