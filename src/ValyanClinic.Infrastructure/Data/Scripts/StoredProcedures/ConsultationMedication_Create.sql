SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: ConsultationMedication_Create
-- Adauga un medicament CNAS in tratamentul recomandat al consultatiei.
-- PatientId se ia din consultatie (nu din client). @CopaymentListType NULL = necompensat.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ConsultationMedication_Create
    @ClinicId          UNIQUEIDENTIFIER,
    @ConsultationId    UNIQUEIDENTIFIER,
    @DrugCode          NVARCHAR(50),
    @CopaymentListType NVARCHAR(20)   = NULL,
    @DoseMorning       DECIMAL(4,2)   = NULL,
    @DoseAfternoon     DECIMAL(4,2)   = NULL,
    @DoseEvening       DECIMAL(4,2)   = NULL,
    @DurationDays      INT            = NULL,
    @Notes             NVARCHAR(1000) = NULL,
    @CreatedBy         UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @PatientId UNIQUEIDENTIFIER, @StatusCode NVARCHAR(50);

        SELECT @PatientId = c.PatientId, @StatusCode = s.Code
        FROM dbo.Consultations c
        LEFT JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND c.IsDeleted = 0;

        IF @PatientId IS NULL
        BEGIN
            ;THROW 50020, N'Consultația nu a fost găsită.', 1;
        END;

        IF @StatusCode = N'BLOCATA'
        BEGIN
            ;THROW 50021, N'Consultația este blocată și nu poate fi modificată.', 1;
        END;

        IF NOT EXISTS (SELECT 1 FROM dbo.Cnas_Drug
                       WHERE Code = @DrugCode AND IsActive = 1 AND ValidTo IS NULL)
        BEGIN
            ;THROW 50027, N'Medicamentul nu există în nomenclatorul CNAS sau nu mai este activ.', 1;
        END;

        IF @CopaymentListType IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM dbo.Cnas_CopaymentListDrug
            WHERE DrugCode = @DrugCode AND CopaymentListType = @CopaymentListType AND IsActive = 1)
        BEGIN
            ;THROW 50028, N'Medicamentul nu este compensat pe lista selectată.', 1;
        END;

        DECLARE @NewId UNIQUEIDENTIFIER = NEWID();
        DECLARE @SortOrder INT = ISNULL((
            SELECT MAX(SortOrder) FROM dbo.ConsultationMedications
            WHERE ConsultationId = @ConsultationId AND ClinicId = @ClinicId AND IsDeleted = 0), -1) + 1;

        INSERT INTO dbo.ConsultationMedications
            (Id, ClinicId, ConsultationId, PatientId, DrugCode, DrugName, ActiveSubstance,
             PharmaceuticalForm, Concentration, PrescriptionMode, CopaymentListType,
             DoseMorning, DoseAfternoon, DoseEvening, DurationDays, Notes, SortOrder, CreatedAt, CreatedBy)
        SELECT
            @NewId, @ClinicId, @ConsultationId, @PatientId, d.Code, d.Name, d.ActiveSubstanceCode,
            d.PharmaceuticalForm, d.Concentration, d.PrescriptionMode, @CopaymentListType,
            @DoseMorning, @DoseAfternoon, @DoseEvening, @DurationDays, @Notes, @SortOrder, GETDATE(), @CreatedBy
        FROM dbo.Cnas_Drug d
        WHERE d.Code = @DrugCode;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'ConsultationMedication', @NewId, N'Create', NULL,
                (SELECT @ConsultationId AS ConsultationId, @DrugCode AS DrugCode,
                        @CopaymentListType AS CopaymentListType FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
                @CreatedBy);

        COMMIT TRANSACTION;
        SELECT @NewId;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
