SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Cnas_Drug_SearchForPrescription
-- Cautare medicamente CNAS active pentru tratamentul din consultatie.
-- Compensatele sunt returnate primele, cu listele de compensare (A,B,C1,...).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Cnas_Drug_SearchForPrescription
    @ClinicId UNIQUEIDENTIFIER,   -- nomenclatorul CNAS e national; pastrat pentru contractul SP-urilor
    @Search   NVARCHAR(200),
    @Top      INT = 30
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @Clean  NVARCHAR(200) = LTRIM(RTRIM(@Search));
    DECLARE @Term   NVARCHAR(202) = N'%' + @Clean + N'%';
    DECLARE @Prefix NVARCHAR(201) = @Clean + N'%';

    SELECT TOP (@Top)
        d.Code,
        d.Name,
        d.ActiveSubstanceCode,
        d.PharmaceuticalForm,
        d.Concentration,
        d.PresentationMode,
        d.PrescriptionMode,
        d.PricePerPackage,
        CAST(IIF(cl.CopaymentLists IS NULL, 0, 1) AS BIT) AS IsCompensated,
        cl.CopaymentLists
    FROM dbo.Cnas_Drug d
    OUTER APPLY (
        SELECT STRING_AGG(x.CopaymentListType, N',') WITHIN GROUP (ORDER BY x.CopaymentListType) AS CopaymentLists
        FROM (
            SELECT DISTINCT cld.CopaymentListType
            FROM dbo.Cnas_CopaymentListDrug cld
            WHERE cld.DrugCode = d.Code AND cld.IsActive = 1
        ) x
    ) cl
    -- Baza e Latin1_General_CS_AI; cautarea trebuie sa fie case-insensitive
    WHERE d.IsActive = 1
      AND d.ValidTo IS NULL
      AND (d.Name COLLATE Latin1_General_CI_AI LIKE @Term
           OR d.Code COLLATE Latin1_General_CI_AI LIKE @Prefix
           OR d.ActiveSubstanceCode COLLATE Latin1_General_CI_AI LIKE @Term)
    ORDER BY
        IIF(d.Name COLLATE Latin1_General_CI_AI LIKE @Prefix, 0, 1),
        IIF(cl.CopaymentLists IS NULL, 1, 0),
        d.Name;
END;
GO
