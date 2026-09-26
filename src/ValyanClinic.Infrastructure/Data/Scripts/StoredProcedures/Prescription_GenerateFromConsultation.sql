SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO
-- ============================================================================
-- SP: Prescription_GenerateFromConsultation
-- Generează rețetele (ciornă) din tratamentul recomandat al consultației.
-- Se preiau doar medicamentele care nu sunt deja pe o rețetă neanulată, astfel
-- încât generarea repetată nu dublează rețetele. Separarea compensat / simplu
-- și pe programe naționale se face în Prescription_CreateFromItems.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Prescription_GenerateFromConsultation
    @ClinicId          UNIQUEIDENTIFIER,
    @ConsultationId    UNIQUEIDENTIFIER,
    @CareTypeId        UNIQUEIDENTIFIER = NULL,
    @InsuredCategoryId UNIQUEIDENTIFIER = NULL,
    @TreatmentDays     INT              = NULL,
    @CreatedBy         UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @PatientId UNIQUEIDENTIFIER, @DoctorId UNIQUEIDENTIFIER,
            @DiagnosticJson NVARCHAR(MAX), @CodesJson NVARCHAR(MAX);

    SELECT @PatientId = c.PatientId, @DoctorId = c.DoctorId,
           @DiagnosticJson = c.Diagnostic, @CodesJson = c.DiagnosticCodes
    FROM dbo.Consultations c
    WHERE c.Id = @ConsultationId AND c.ClinicId = @ClinicId AND c.IsDeleted = 0;

    IF @PatientId IS NULL
    BEGIN
        ;THROW 50020, N'Consultația nu a fost găsită.', 1;
    END;

    -- Diagnosticul consultației e salvat ca JSON (cod principal + descriere) de selectorul ICD-10
    DECLARE @PrimaryCode NVARCHAR(20) = NULL, @DiagnosticText NVARCHAR(1000) = NULL, @CodeList NVARCHAR(500) = NULL;

    IF ISJSON(@DiagnosticJson) = 1
    BEGIN
        SET @PrimaryCode    = LEFT(JSON_VALUE(@DiagnosticJson, '$.primaryCode.code'), 20);
        SET @DiagnosticText = LEFT(JSON_VALUE(@DiagnosticJson, '$.primaryCode.shortDescriptionRo'), 1000);
    END
    ELSE
        SET @DiagnosticText = LEFT(NULLIF(LTRIM(RTRIM(@DiagnosticJson)), N''), 1000);

    IF ISJSON(@CodesJson) = 1
    BEGIN
        SELECT @CodeList = LEFT(STRING_AGG(CAST(j.value AS NVARCHAR(20)), N', ')
                                WITHIN GROUP (ORDER BY CAST(j.[key] AS INT)), 500)
        FROM OPENJSON(@CodesJson) j;

        IF @PrimaryCode IS NULL
            SELECT TOP 1 @PrimaryCode = CAST(j.value AS NVARCHAR(20))
            FROM OPENJSON(@CodesJson) j
            ORDER BY CAST(j.[key] AS INT);
    END;

    DECLARE @Items dbo.PrescriptionItemTableType;

    INSERT INTO @Items
        (ConsultationMedicationId, DrugCode, DrugName, CopaymentListType, DiagnosisCode,
         DoseMorning, DoseAfternoon, DoseEvening, DurationDays, Quantity, Instructions, SortOrder)
    SELECT
        cm.Id, cm.DrugCode, cm.DrugName, cm.CopaymentListType,
        IIF(cm.CopaymentListType IS NULL, NULL, @PrimaryCode),
        cm.DoseMorning, cm.DoseAfternoon, cm.DoseEvening, cm.DurationDays, cm.TotalQuantity, cm.Notes, cm.SortOrder
    FROM dbo.ConsultationMedications cm
    WHERE cm.ConsultationId = @ConsultationId
      AND cm.ClinicId = @ClinicId
      AND cm.IsDeleted = 0
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.PrescriptionItems pi
          INNER JOIN dbo.Prescriptions p         ON p.Id = pi.PrescriptionId AND p.IsDeleted = 0
          INNER JOIN dbo.PrescriptionStatuses s  ON s.Id = p.StatusId
          WHERE pi.ConsultationMedicationId = cm.Id
            AND pi.IsDeleted = 0
            AND s.Code <> N'ANULATA');

    IF NOT EXISTS (SELECT 1 FROM @Items)
    BEGIN
        ;THROW 50045, N'Nu există medicamente noi de prescris: tratamentul este gol sau toate medicamentele sunt deja pe rețete.', 1;
    END;

    EXEC dbo.Prescription_CreateFromItems
        @ClinicId          = @ClinicId,
        @PatientId         = @PatientId,
        @DoctorId          = @DoctorId,
        @ConsultationId    = @ConsultationId,
        @CareTypeId        = @CareTypeId,
        @InsuredCategoryId = @InsuredCategoryId,
        @TreatmentDays     = @TreatmentDays,
        @Diagnostic        = @DiagnosticText,
        @DiagnosticCodes   = @CodeList,
        @Items             = @Items,
        @CreatedBy         = @CreatedBy;
END;
GO
