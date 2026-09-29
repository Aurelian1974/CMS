SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ConsultationService_GetUnbilledInvestigations
-- Investigațiile efectuate (interne, facturabile) care nu au linie de serviciu, cu motivul:
--   NO_SERVICE       — tipul nu are serviciu în tarife (se importă din Tarife)
--   SERVICE_INACTIVE — serviciul există, dar e dezactivat
--   NO_PRICE         — serviciul nu are preț în vigoare
--   NOT_SYNCED       — se poate factura acum; lipsește doar sincronizarea
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ConsultationService_GetUnbilledInvestigations
    @ConsultationId UNIQUEIDENTIFIER,
    @ClinicId       UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @CompletedStatus TINYINT = 2;
    DECLARE @Today DATE = CAST(GETDATE() AS DATE);

    SELECT
        ci.Id AS ConsultationInvestigationId,
        ci.InvestigationType AS InvestigationTypeCode,
        d.DisplayName AS InvestigationName,
        ci.InvestigationDate,
        ms.Code AS ServiceCode,
        CASE WHEN ms.Id IS NULL      THEN N'NO_SERVICE'
             WHEN ms.IsActive = 0    THEN N'SERVICE_INACTIVE'
             WHEN p.Price IS NULL    THEN N'NO_PRICE'
             ELSE N'NOT_SYNCED' END AS ReasonCode
    FROM dbo.ConsultationInvestigations ci
    INNER JOIN dbo.InvestigationTypeDefinitions d ON d.TypeCode = ci.InvestigationType
    OUTER APPLY (
        SELECT TOP (1) s.Id, s.Code, s.IsActive
        FROM dbo.MedicalServices s
        WHERE s.ClinicId = @ClinicId AND s.IsDeleted = 0 AND s.InvestigationTypeCode = ci.InvestigationType
        ORDER BY s.IsActive DESC
    ) ms
    OUTER APPLY (
        SELECT TOP (1) mp.Price
        FROM dbo.MedicalServicePrices mp
        WHERE mp.MedicalServiceId = ms.Id AND mp.ValidFrom <= @Today
          AND (mp.ValidTo IS NULL OR mp.ValidTo > @Today)
        ORDER BY mp.ValidFrom DESC
    ) p
    WHERE ci.ConsultationId = @ConsultationId
      AND ci.ClinicId = @ClinicId
      AND ci.IsDeleted = 0
      AND ci.IsExternal = 0
      AND ci.Status = @CompletedStatus
      AND d.IsBillable = 1
      AND NOT EXISTS (
          SELECT 1 FROM dbo.ConsultationServices cs
          WHERE cs.ConsultationInvestigationId = ci.Id AND cs.IsDeleted = 0)
    ORDER BY ci.InvestigationDate, d.DisplayName;
END;
GO
