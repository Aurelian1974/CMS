SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Prescription_CreateFromItems
-- Creează una sau mai multe rețete (ciornă) din lista de medicamente, separând automat:
--   * medicamentele compensate -> rețetă compensată CNAS, câte una per program național
--     (medicamentele din programe diferite nu se amestecă pe aceeași rețetă);
--   * medicamentele necompensate -> rețetă simplă;
--   * fiecare grup se împarte în bucăți de maxim PrescriptionTypes.MaxItems medicamente.
-- Returnează Id-urile rețetelor create (compensate întâi).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Prescription_CreateFromItems
    @ClinicId             UNIQUEIDENTIFIER,
    @PatientId            UNIQUEIDENTIFIER,
    @DoctorId             UNIQUEIDENTIFIER,
    @ConsultationId       UNIQUEIDENTIFIER = NULL,
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
    @CreatedBy            UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM dbo.Patients
                       WHERE Id = @PatientId AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50002, N'Pacientul nu a fost găsit.', 1;
        END;

        IF NOT EXISTS (SELECT 1 FROM dbo.Doctors
                       WHERE Id = @DoctorId AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50300, N'Doctorul nu a fost găsit.', 1;
        END;

        IF @ConsultationId IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM dbo.Consultations
            WHERE Id = @ConsultationId AND ClinicId = @ClinicId AND PatientId = @PatientId AND IsDeleted = 0)
        BEGIN
            ;THROW 50020, N'Consultația nu a fost găsită.', 1;
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

        DECLARE @CnasTypeId UNIQUEIDENTIFIER, @CnasMaxItems INT,
                @SimpleTypeId UNIQUEIDENTIFIER, @SimpleMaxItems INT,
                @DraftStatusId UNIQUEIDENTIFIER;

        SELECT TOP 1 @CnasTypeId = Id, @CnasMaxItems = MaxItems
        FROM dbo.PrescriptionTypes WHERE IsCnas = 1 AND IsActive = 1 ORDER BY SortOrder;

        SELECT TOP 1 @SimpleTypeId = Id, @SimpleMaxItems = MaxItems
        FROM dbo.PrescriptionTypes WHERE IsCnas = 0 AND IsActive = 1 ORDER BY SortOrder;

        SELECT @DraftStatusId = Id FROM dbo.PrescriptionStatuses WHERE Code = N'CIORNA';

        IF (@CnasTypeId IS NULL AND EXISTS (SELECT 1 FROM dbo.PrescriptionItem_Enrich(@Items) WHERE IsCompensated = 1))
           OR (@SimpleTypeId IS NULL AND EXISTS (SELECT 1 FROM dbo.PrescriptionItem_Enrich(@Items) WHERE IsCompensated = 0))
           OR @DraftStatusId IS NULL
        BEGIN
            ;THROW 50046, N'Tipurile de rețetă nu sunt configurate în nomenclator.', 1;
        END;

        DECLARE @Work TABLE (
            RowId                    INT IDENTITY(1,1) PRIMARY KEY,
            ConsultationMedicationId UNIQUEIDENTIFIER NULL,
            DrugCode                 NVARCHAR(50)     NULL,
            DrugName                 NVARCHAR(500)    NOT NULL,
            ActiveSubstance          NVARCHAR(200)    NULL,
            PharmaceuticalForm       NVARCHAR(200)    NULL,
            Concentration            NVARCHAR(200)    NULL,
            PrescriptionMode         NVARCHAR(50)     NULL,
            CopaymentListType        NVARCHAR(20)     NULL,
            CopaymentPercent         DECIMAL(5,2)     NULL,
            NhpCode                  NVARCHAR(30)     NULL,
            DiagnosisCode            NVARCHAR(20)     NULL,
            DoseMorning              DECIMAL(4,2)     NULL,
            DoseAfternoon            DECIMAL(4,2)     NULL,
            DoseEvening              DECIMAL(4,2)     NULL,
            DurationDays             INT              NULL,
            Quantity                 DECIMAL(9,2)     NULL,
            Instructions             NVARCHAR(1000)   NULL,
            SortOrder                INT              NOT NULL,
            IsCompensated            BIT              NOT NULL,
            GroupKey                 NVARCHAR(40)     NOT NULL,
            ChunkNo                  INT              NOT NULL DEFAULT 0
        );

        INSERT INTO @Work
            (ConsultationMedicationId, DrugCode, DrugName, ActiveSubstance, PharmaceuticalForm, Concentration,
             PrescriptionMode, CopaymentListType, CopaymentPercent, NhpCode, DiagnosisCode,
             DoseMorning, DoseAfternoon, DoseEvening, DurationDays, Quantity, Instructions, SortOrder,
             IsCompensated, GroupKey)
        SELECT
            e.ConsultationMedicationId, e.DrugCode, e.DrugName, e.ActiveSubstance, e.PharmaceuticalForm, e.Concentration,
            e.PrescriptionMode, e.CopaymentListType, e.CopaymentPercent, e.NhpCode, e.DiagnosisCode,
            e.DoseMorning, e.DoseAfternoon, e.DoseEvening, e.DurationDays, e.Quantity, e.Instructions, e.SortOrder,
            e.IsCompensated,
            IIF(e.IsCompensated = 1, N'C|' + ISNULL(e.NhpCode, N''), N'S')
        FROM dbo.PrescriptionItem_Enrich(@Items) e
        ORDER BY e.SortOrder;

        ;WITH numbered AS (
            SELECT w.ChunkNo, w.IsCompensated,
                   ROW_NUMBER() OVER (PARTITION BY w.GroupKey ORDER BY w.SortOrder, w.RowId) AS Rn
            FROM @Work w
        )
        UPDATE numbered
        SET ChunkNo = CASE
            WHEN IsCompensated = 1 AND @CnasMaxItems   IS NOT NULL THEN (Rn - 1) / @CnasMaxItems
            WHEN IsCompensated = 0 AND @SimpleMaxItems IS NOT NULL THEN (Rn - 1) / @SimpleMaxItems
            ELSE 0 END;

        DECLARE @Groups TABLE (
            PrescriptionId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
            GroupKey       NVARCHAR(40)     NOT NULL,
            ChunkNo        INT              NOT NULL,
            IsCompensated  BIT              NOT NULL,
            NhpCode        NVARCHAR(30)     NULL,
            MaxDuration    INT              NULL,
            FirstSort      INT              NOT NULL
        );

        INSERT INTO @Groups (PrescriptionId, GroupKey, ChunkNo, IsCompensated, NhpCode, MaxDuration, FirstSort)
        SELECT NEWID(), w.GroupKey, w.ChunkNo, w.IsCompensated, MAX(w.NhpCode), MAX(w.DurationDays), MIN(w.SortOrder)
        FROM @Work w
        GROUP BY w.GroupKey, w.ChunkNo, w.IsCompensated;

        INSERT INTO dbo.Prescriptions
            (Id, ClinicId, PatientId, DoctorId, ConsultationId, PrescriptionTypeId, StatusId, CareTypeId,
             InsuredCategoryId, NhpCode, TreatmentDays, Diagnostic, DiagnosticCodes, RegistryNumber,
             IsContinuation, ReferralLetterNumber, Notes, CreatedAt, CreatedBy)
        SELECT
            g.PrescriptionId, @ClinicId, @PatientId, @DoctorId, @ConsultationId,
            IIF(g.IsCompensated = 1, @CnasTypeId, @SimpleTypeId),
            @DraftStatusId,
            @CareTypeId,
            IIF(g.IsCompensated = 1, @InsuredCategoryId, NULL),
            g.NhpCode,
            COALESCE(@TreatmentDays, g.MaxDuration),
            @Diagnostic, @DiagnosticCodes, @RegistryNumber,
            IIF(g.IsCompensated = 1, @IsContinuation, 0),
            IIF(g.IsCompensated = 1, @ReferralLetterNumber, NULL),
            @Notes, GETDATE(), @CreatedBy
        FROM @Groups g;

        INSERT INTO dbo.PrescriptionItems
            (ClinicId, PrescriptionId, ConsultationMedicationId, DrugCode, DrugName, ActiveSubstance,
             PharmaceuticalForm, Concentration, PrescriptionMode, CopaymentListType, CopaymentPercent,
             DiagnosisCode, DoseMorning, DoseAfternoon, DoseEvening, DurationDays, Quantity, Instructions,
             SortOrder, CreatedAt, CreatedBy)
        SELECT
            @ClinicId, g.PrescriptionId, w.ConsultationMedicationId, w.DrugCode, w.DrugName, w.ActiveSubstance,
            w.PharmaceuticalForm, w.Concentration, w.PrescriptionMode, w.CopaymentListType, w.CopaymentPercent,
            w.DiagnosisCode, w.DoseMorning, w.DoseAfternoon, w.DoseEvening, w.DurationDays, w.Quantity, w.Instructions,
            ROW_NUMBER() OVER (PARTITION BY g.PrescriptionId ORDER BY w.SortOrder, w.RowId) - 1,
            GETDATE(), @CreatedBy
        FROM @Work w
        INNER JOIN @Groups g ON g.GroupKey = w.GroupKey AND g.ChunkNo = w.ChunkNo;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        SELECT @ClinicId, N'Prescription', g.PrescriptionId, N'Create', NULL,
               (SELECT g.IsCompensated AS IsCompensated, g.NhpCode AS NhpCode,
                       @ConsultationId AS ConsultationId, @PatientId AS PatientId
                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
               @CreatedBy
        FROM @Groups g;

        COMMIT TRANSACTION;

        SELECT g.PrescriptionId
        FROM @Groups g
        ORDER BY g.IsCompensated DESC, g.FirstSort, g.ChunkNo;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
