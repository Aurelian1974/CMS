SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ConsultationService_GetByConsultation — liniile de servicii ale consultației
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ConsultationService_GetByConsultation
    @ConsultationId UNIQUEIDENTIFIER,
    @ClinicId       UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT
        cs.Id, cs.ConsultationId, cs.MedicalServiceId, cs.ServiceCode, cs.ServiceName,
        sc.Name AS CategoryName, cs.UnitPrice, cs.Quantity, cs.LineTotal,
        cs.VatRateId, cs.VatPercent, cs.VatCategoryCode, cs.SortOrder, cs.CreatedAt
    FROM dbo.ConsultationServices cs
    INNER JOIN dbo.Consultations c   ON c.Id = cs.ConsultationId AND c.IsDeleted = 0
    INNER JOIN dbo.MedicalServices ms ON ms.Id = cs.MedicalServiceId
    INNER JOIN dbo.ServiceCategories sc ON sc.Id = ms.CategoryId
    WHERE cs.ConsultationId = @ConsultationId
      AND cs.ClinicId = @ClinicId
      AND cs.IsDeleted = 0
    ORDER BY cs.SortOrder, cs.CreatedAt;
END;
GO
