SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Prescription_GetLookups
-- Nomenclatoarele rețetelor pentru filtre și formulare.
-- Result sets: 1) tipuri  2) statusuri  3) tipuri afecțiune  4) categorii asigurat
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Prescription_GetLookups
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT Id, Code, Name, IsCnas, MaxItems
    FROM dbo.PrescriptionTypes
    WHERE IsActive = 1
    ORDER BY SortOrder;

    SELECT Id, Code, Name
    FROM dbo.PrescriptionStatuses
    WHERE IsActive = 1
    ORDER BY SortOrder;

    SELECT Id, Code, Name, MaxDays, ValidityDays
    FROM dbo.PrescriptionCareTypes
    WHERE IsActive = 1
    ORDER BY SortOrder;

    SELECT Id, Code, Name
    FROM dbo.PrescriptionInsuredCategories
    WHERE IsActive = 1
    ORDER BY SortOrder;
END;
GO
