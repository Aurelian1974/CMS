SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Prescription_Update
-- Actualizează o rețetă în ciornă: antetul și lista completă de medicamente
-- (înlocuire). Tipul rețetei nu se schimbă, deci medicamentele trebuie să fie
-- compatibile cu el: pe compensată doar medicamente compensate din același
-- program național, pe simplă doar necompensate.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Prescription_Update
    @Id                   UNIQUEIDENTIFIER,
    @ClinicId             UNIQUEIDENTIFIER,
    @CareTypeId           UNIQUEIDENTIFIER = NULL,
    @InsuredCategoryId    UNIQUEIDENTIFIER = NULL,
    @TreatmentDays        INT              = NULL,
    @Diagnostic           NVARCHAR(1000)   = NULL,
    @DiagnosticCodes      NVARCHAR(500)    = NULL,
    @RegistryNumber       NVARCHAR(50)     = NULL,
    @IsContinuation       BIT              = 0,
    @ReferralLetterNumber NVARCHAR(50)     = NULL,
    @Notes                NVARCHAR(1000)   = NULL,
    @Items                dbo.PrescriptionItemTableType READONLY,
    @UpdatedBy            UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @StatusCode NVARCHAR(30), @IsCnas BIT, @MaxItems INT;

        SELECT @StatusCode = s.Code, @IsCnas = t.IsCnas, @MaxItems = t.MaxItems
        FROM dbo.Prescriptions p WITH (UPDLOCK)
        INNER JOIN dbo.PrescriptionStatuses s ON s.Id = p.StatusId
        INNER JOIN dbo.PrescriptionTypes t    ON t.Id = p.PrescriptionTypeId
        WHERE p.Id = @Id AND p.ClinicId = @ClinicId AND p.IsDeleted = 0;

        IF @StatusCode IS NULL
        BEGIN
            ;THROW 50041, N'Rețeta nu a fost găsită.', 1;
        END;

        IF @StatusCode <> N'CIORNA'
        BEGIN
            ;THROW 50042, N'Doar rețetele în ciornă pot fi modificate.', 1;
        END;

        IF @CareTypeId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM dbo.PrescriptionCareTypes WHERE Id = @CareTypeId AND IsActive = 1)
        BEGIN
            ;THROW 50047, N'Tipul de afecțiune selectat nu este valid.', 1;
        END;

        IF @InsuredCategoryId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM dbo.PrescriptionInsuredCategories WHERE Id = @InsuredCategoryId AND IsActive = 1)
        BEGIN
            ;THROW 50046, N'Categoria de asigurat selectată nu este validă.', 1;
        END;

        EXEC dbo.Prescription_ValidateItems @ClinicId = @ClinicId, @Items = @Items;

        IF @MaxItems IS NOT NULL AND (SELECT COUNT(*) FROM @Items) > @MaxItems
        BEGIN
            DECLARE @MaxMsg NVARCHAR(200) = CONCAT(N'Rețeta poate conține maximum ', @MaxItems, N' medicamente.');
            ;THROW 50048, @MaxMsg, 1;
        END;

        IF @IsCnas = 1 AND EXISTS (SELECT 1 FROM dbo.PrescriptionItem_Enrich(@Items) WHERE IsCompensated = 0)
        BEGIN
            ;THROW 50046, N'Pe rețeta compensată toate medicamentele trebuie să aibă o listă de compensare.', 1;
        END;

        IF @IsCnas = 0 AND EXISTS (SELECT 1 FROM dbo.PrescriptionItem_Enrich(@Items) WHERE IsCompensated = 1)
        BEGIN
            ;THROW 50046, N'Rețeta simplă nu poate conține medicamente compensate.', 1;
        END;

        IF @IsCnas = 1 AND (SELECT COUNT(DISTINCT ISNULL(NhpCode, N'')) FROM dbo.PrescriptionItem_Enrich(@Items)) > 1
        BEGIN
            ;THROW 50046, N'Medicamentele din programe naționale diferite (sau din afara programelor) se prescriu pe rețete separate.', 1;
        END;

        DECLARE @OldValues NVARCHAR(MAX) = (
            SELECT CareTypeId, InsuredCategoryId, TreatmentDays, Diagnostic, DiagnosticCodes,
                   RegistryNumber, IsContinuation, ReferralLetterNumber, Notes
            FROM dbo.Prescriptions WHERE Id = @Id
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER);

        UPDATE dbo.Prescriptions SET
            CareTypeId           = @CareTypeId,
            InsuredCategoryId    = IIF(@IsCnas = 1, @InsuredCategoryId, NULL),
            NhpCode              = IIF(@IsCnas = 1, (SELECT MAX(NhpCode) FROM dbo.PrescriptionItem_Enrich(@Items)), NULL),
            TreatmentDays        = @TreatmentDays,
            Diagnostic           = @Diagnostic,
            DiagnosticCodes      = @DiagnosticCodes,
            RegistryNumber       = @RegistryNumber,
            IsContinuation       = IIF(@IsCnas = 1, @IsContinuation, 0),
            ReferralLetterNumber = IIF(@IsCnas = 1, @ReferralLetterNumber, NULL),
            Notes                = @Notes,
            UpdatedAt            = GETDATE(),
            UpdatedBy            = @UpdatedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        UPDATE dbo.PrescriptionItems SET
            IsDeleted = 1, UpdatedAt = GETDATE(), UpdatedBy = @UpdatedBy
        WHERE PrescriptionId = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        INSERT INTO dbo.PrescriptionItems
            (ClinicId, PrescriptionId, ConsultationMedicationId, DrugCode, DrugName, ActiveSubstance,
             PharmaceuticalForm, Concentration, PrescriptionMode, CopaymentListType, CopaymentPercent,
             DiagnosisCode, DoseMorning, DoseAfternoon, DoseEvening, DurationDays, Quantity, Instructions,
             SortOrder, CreatedAt, CreatedBy)
        SELECT
            @ClinicId, @Id, e.ConsultationMedicationId, e.DrugCode, e.DrugName, e.ActiveSubstance,
            e.PharmaceuticalForm, e.Concentration, e.PrescriptionMode, e.CopaymentListType, e.CopaymentPercent,
            e.DiagnosisCode, e.DoseMorning, e.DoseAfternoon, e.DoseEvening, e.DurationDays, e.Quantity, e.Instructions,
            ROW_NUMBER() OVER (ORDER BY e.SortOrder) - 1, GETDATE(), @UpdatedBy
        FROM dbo.PrescriptionItem_Enrich(@Items) e;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Prescription', @Id, N'Update', @OldValues,
                (SELECT @CareTypeId AS CareTypeId, @TreatmentDays AS TreatmentDays,
                        (SELECT COUNT(*) FROM @Items) AS ItemCount
                 FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @UpdatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
