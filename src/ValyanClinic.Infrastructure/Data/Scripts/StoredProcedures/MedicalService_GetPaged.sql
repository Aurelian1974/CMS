SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: MedicalService_GetPaged
-- Listă tarife cu prețul în vigoare azi și următoarea versiune programată.
-- Result sets: 1) rânduri  2) total  3) statistici
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.MedicalService_GetPaged
    @ClinicId   UNIQUEIDENTIFIER,
    @Search     NVARCHAR(200)    = NULL,
    @CategoryId UNIQUEIDENTIFIER = NULL,
    @IsActive   BIT              = NULL,
    @Page       INT              = 1,
    @PageSize   INT              = 20,
    @SortBy     NVARCHAR(50)     = 'Name',
    @SortDir    NVARCHAR(4)      = 'asc'
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Today DATE = CAST(GETDATE() AS DATE);
    DECLARE @Term  NVARCHAR(202) = CASE WHEN NULLIF(LTRIM(RTRIM(@Search)), '') IS NULL THEN NULL
                                        ELSE N'%' + LTRIM(RTRIM(@Search)) + N'%' END;

    ;WITH Filtered AS (
        SELECT
            ms.Id, ms.Code, ms.Name, ms.CategoryId, sc.Name AS CategoryName, sc.Code AS CategoryCode,
            ms.DurationMinutes, ms.InvestigationTypeCode, ms.IsActive,
            cur.Price AS CurrentPrice, cur.VatRateId AS CurrentVatRateId, cv.Name AS CurrentVatRateName,
            cv.[Percent] AS CurrentVatPercent, cur.ValidFrom AS CurrentValidFrom,
            nxt.Price AS NextPrice, nxt.ValidFrom AS NextValidFrom
        FROM dbo.MedicalServices ms
        INNER JOIN dbo.ServiceCategories sc ON sc.Id = ms.CategoryId
        OUTER APPLY (
            SELECT TOP (1) p.Price, p.VatRateId, p.ValidFrom
            FROM dbo.MedicalServicePrices p
            WHERE p.MedicalServiceId = ms.Id AND p.ValidFrom <= @Today
              AND (p.ValidTo IS NULL OR p.ValidTo > @Today)
            ORDER BY p.ValidFrom DESC
        ) cur
        LEFT JOIN dbo.VatRates cv ON cv.Id = cur.VatRateId
        OUTER APPLY (
            SELECT TOP (1) p.Price, p.ValidFrom
            FROM dbo.MedicalServicePrices p
            WHERE p.MedicalServiceId = ms.Id AND p.ValidFrom > @Today
            ORDER BY p.ValidFrom
        ) nxt
        WHERE ms.ClinicId = @ClinicId
          AND ms.IsDeleted = 0
          AND (@CategoryId IS NULL OR ms.CategoryId = @CategoryId)
          AND (@IsActive IS NULL OR ms.IsActive = @IsActive)
          AND (@Term IS NULL
               OR ms.Name COLLATE Latin1_General_CI_AI LIKE @Term
               OR ms.Code COLLATE Latin1_General_CI_AI LIKE @Term)
    )
    SELECT *
    FROM Filtered
    ORDER BY
        CASE WHEN @SortBy = 'Code'  AND @SortDir = 'asc'  THEN Code END ASC,
        CASE WHEN @SortBy = 'Code'  AND @SortDir = 'desc' THEN Code END DESC,
        CASE WHEN @SortBy = 'Price' AND @SortDir = 'asc'  THEN CurrentPrice END ASC,
        CASE WHEN @SortBy = 'Price' AND @SortDir = 'desc' THEN CurrentPrice END DESC,
        CASE WHEN @SortBy = 'Category' AND @SortDir = 'asc'  THEN CategoryName END ASC,
        CASE WHEN @SortBy = 'Category' AND @SortDir = 'desc' THEN CategoryName END DESC,
        CASE WHEN @SortBy NOT IN ('Code', 'Price', 'Category') AND @SortDir = 'desc' THEN Name END DESC,
        Name ASC
    OFFSET (@Page - 1) * @PageSize ROWS FETCH NEXT @PageSize ROWS ONLY;

    SELECT COUNT(*)
    FROM dbo.MedicalServices ms
    WHERE ms.ClinicId = @ClinicId
      AND ms.IsDeleted = 0
      AND (@CategoryId IS NULL OR ms.CategoryId = @CategoryId)
      AND (@IsActive IS NULL OR ms.IsActive = @IsActive)
      AND (@Term IS NULL
           OR ms.Name COLLATE Latin1_General_CI_AI LIKE @Term
           OR ms.Code COLLATE Latin1_General_CI_AI LIKE @Term);

    SELECT
        COUNT(*)                                        AS TotalCount,
        ISNULL(SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END), 0) AS ActiveCount,
        ISNULL(SUM(CASE WHEN IsActive = 0 THEN 1 ELSE 0 END), 0) AS InactiveCount
    FROM dbo.MedicalServices
    WHERE ClinicId = @ClinicId AND IsDeleted = 0;
END;
GO
