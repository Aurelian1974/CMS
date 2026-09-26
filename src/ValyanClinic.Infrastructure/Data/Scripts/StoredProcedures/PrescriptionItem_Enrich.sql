SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- Funcție: PrescriptionItem_Enrich
-- Completează medicamentele primite (TVP) cu datele din nomenclatorul CNAS:
-- snapshot denumire/formă/concentrație, procentul listei de compensare (la momentul
-- prescrierii) și programul național. Indicatorii *Exists / ListMatches permit
-- SP-urilor apelante să valideze fără a repeta join-urile.
-- ============================================================================
CREATE OR ALTER FUNCTION dbo.PrescriptionItem_Enrich (@Items dbo.PrescriptionItemTableType READONLY)
RETURNS TABLE
AS
RETURN
(
    SELECT
        i.ConsultationMedicationId,
        NULLIF(LTRIM(RTRIM(i.DrugCode)), N'')          AS DrugCode,
        COALESCE(NULLIF(LTRIM(RTRIM(i.DrugName)), N''), d.Name) AS DrugName,
        d.ActiveSubstanceCode                           AS ActiveSubstance,
        d.PharmaceuticalForm,
        d.Concentration,
        d.PrescriptionMode,
        NULLIF(LTRIM(RTRIM(i.CopaymentListType)), N'')  AS CopaymentListType,
        clt.CopaymentPercent,
        cld.NhpCode,
        NULLIF(LTRIM(RTRIM(i.DiagnosisCode)), N'')      AS DiagnosisCode,
        i.DoseMorning,
        i.DoseAfternoon,
        i.DoseEvening,
        i.DurationDays,
        COALESCE(i.Quantity, CAST(
            NULLIF(ISNULL(i.DoseMorning, 0) + ISNULL(i.DoseAfternoon, 0) + ISNULL(i.DoseEvening, 0), 0)
            * i.DurationDays AS DECIMAL(9,2)))          AS Quantity,
        NULLIF(LTRIM(RTRIM(i.Instructions)), N'')       AS Instructions,
        i.SortOrder,
        CAST(IIF(NULLIF(LTRIM(RTRIM(i.CopaymentListType)), N'') IS NULL, 0, 1) AS BIT) AS IsCompensated,
        CAST(IIF(d.Code IS NOT NULL AND d.IsActive = 1, 1, 0) AS BIT)               AS DrugExists,
        ISNULL(cld.MatchCount, 0)                       AS ListMatches
    FROM @Items i
    LEFT JOIN dbo.Cnas_Drug d
        ON d.Code = NULLIF(LTRIM(RTRIM(i.DrugCode)), N'')
    LEFT JOIN dbo.Cnas_CopaymentListType clt
        ON clt.Code = NULLIF(LTRIM(RTRIM(i.CopaymentListType)), N'')
    OUTER APPLY (
        SELECT MIN(x.NhpCode) AS NhpCode, COUNT(*) AS MatchCount
        FROM dbo.Cnas_CopaymentListDrug x
        WHERE x.DrugCode = d.Code
          AND x.CopaymentListType = NULLIF(LTRIM(RTRIM(i.CopaymentListType)), N'')
          AND x.IsActive = 1
    ) cld
);
GO
