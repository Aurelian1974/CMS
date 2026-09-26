SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: ConsultationMedication_GetByConsultation
-- Tratamentul recomandat al consultatiei + listele de compensare curente ale
-- fiecarui medicament (pentru selectia listei in UI).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ConsultationMedication_GetByConsultation
    @ConsultationId UNIQUEIDENTIFIER,
    @ClinicId       UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        cm.Id,
        cm.ConsultationId,
        cm.PatientId,
        cm.DrugCode,
        cm.DrugName,
        cm.ActiveSubstance,
        cm.PharmaceuticalForm,
        cm.Concentration,
        cm.PrescriptionMode,
        cm.CopaymentListType,
        CAST(IIF(cm.CopaymentListType IS NULL, 0, 1) AS BIT) AS IsCompensated,
        cl.CopaymentLists AS AvailableCopaymentLists,
        cm.DoseMorning,
        cm.DoseAfternoon,
        cm.DoseEvening,
        cm.DurationDays,
        cm.TotalQuantity,
        cm.Notes,
        cm.SortOrder,
        cm.CreatedAt,
        cm.UpdatedAt
    FROM dbo.ConsultationMedications cm
    OUTER APPLY (
        SELECT STRING_AGG(x.CopaymentListType, N',') WITHIN GROUP (ORDER BY x.CopaymentListType) AS CopaymentLists
        FROM (
            SELECT DISTINCT cld.CopaymentListType
            FROM dbo.Cnas_CopaymentListDrug cld
            WHERE cld.DrugCode = cm.DrugCode AND cld.IsActive = 1
        ) x
    ) cl
    WHERE cm.ConsultationId = @ConsultationId
      AND cm.ClinicId = @ClinicId
      AND cm.IsDeleted = 0
    ORDER BY cm.SortOrder, cm.CreatedAt;
END;
GO
