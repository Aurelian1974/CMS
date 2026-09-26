SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Prescription_SyncConsultation
-- Reflectă rețetele emise (neanulate) în câmpurile consultației
-- SaEliberatPrescriptie / SeriePrescriptie, folosite de scrisoarea medicală.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Prescription_SyncConsultation
    @ClinicId       UNIQUEIDENTIFIER,
    @ConsultationId UNIQUEIDENTIFIER,
    @UpdatedBy      UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @ConsultationId IS NULL RETURN;

    DECLARE @SeriesList NVARCHAR(MAX);

    SELECT @SeriesList = STRING_AGG(CONCAT(p.Series, N' ', p.Number), N', ')
                         WITHIN GROUP (ORDER BY p.IssueDate, p.Number)
    FROM dbo.Prescriptions p
    INNER JOIN dbo.PrescriptionStatuses s ON s.Id = p.StatusId
    WHERE p.ConsultationId = @ConsultationId
      AND p.ClinicId = @ClinicId
      AND p.IsDeleted = 0
      AND p.Number IS NOT NULL
      AND s.Code <> N'ANULATA';

    UPDATE dbo.Consultations SET
        SaEliberatPrescriptie = IIF(@SeriesList IS NULL, 0, 1),
        SeriePrescriptie      = LEFT(@SeriesList, 100),
        UpdatedAt             = GETDATE(),
        UpdatedBy             = @UpdatedBy
    WHERE Id = @ConsultationId AND ClinicId = @ClinicId;
END;
GO
