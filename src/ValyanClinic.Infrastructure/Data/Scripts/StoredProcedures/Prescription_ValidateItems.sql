SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Prescription_ValidateItems
-- Validări comune pentru medicamentele unei rețete (creare / actualizare).
-- Nu modifică date; aruncă THROW la prima regulă încălcată.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Prescription_ValidateItems
    @ClinicId UNIQUEIDENTIFIER,
    @Items    dbo.PrescriptionItemTableType READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM @Items)
    BEGIN
        ;THROW 50043, N'Rețeta trebuie să conțină cel puțin un medicament.', 1;
    END;

    IF EXISTS (SELECT 1 FROM dbo.PrescriptionItem_Enrich(@Items) WHERE DrugName IS NULL)
    BEGIN
        ;THROW 50046, N'Fiecare medicament trebuie să aibă o denumire.', 1;
    END;

    IF EXISTS (SELECT 1 FROM dbo.PrescriptionItem_Enrich(@Items) WHERE DrugCode IS NOT NULL AND DrugExists = 0)
    BEGIN
        ;THROW 50027, N'Medicamentul nu există în nomenclatorul CNAS sau nu mai este activ.', 1;
    END;

    IF EXISTS (SELECT 1 FROM dbo.PrescriptionItem_Enrich(@Items)
               WHERE IsCompensated = 1 AND (DrugCode IS NULL OR ListMatches = 0))
    BEGIN
        ;THROW 50028, N'Medicamentul nu este compensat pe lista selectată.', 1;
    END;
END;
GO
