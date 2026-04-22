SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Consultation_Create
-- Descriere: Creează o consultație nouă; default status = În lucru
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_Create
    @ClinicId                   UNIQUEIDENTIFIER,
    @PatientId                  UNIQUEIDENTIFIER,
    @DoctorId                   UNIQUEIDENTIFIER,
    @AppointmentId              UNIQUEIDENTIFIER = NULL,
    @Date                       DATETIME2(0),
    -- Tab 1: Anamneză
    @Motiv                      NVARCHAR(MAX)    = NULL,
    @IstoricMedicalPersonal     NVARCHAR(MAX)    = NULL,
    @TratamentAnterior          NVARCHAR(MAX)    = NULL,
    @IstoricBoalaActuala        NVARCHAR(MAX)    = NULL,
    @IstoricFamilial            NVARCHAR(MAX)    = NULL,
    @FactoriDeRisc              NVARCHAR(MAX)    = NULL,
    @AlergiiConsultatie         NVARCHAR(MAX)    = NULL,
    -- Tab 2: Examen Clinic
    @StareGenerala              NVARCHAR(50)     = NULL,
    @Tegumente                  NVARCHAR(50)     = NULL,
    @Mucoase                    NVARCHAR(50)     = NULL,
    @Greutate                   DECIMAL(5,1)     = NULL,
    @Inaltime                   INT              = NULL,
    @TensiuneSistolica          INT              = NULL,
    @TensiuneDiastolica         INT              = NULL,
    @Puls                       INT              = NULL,
    @FrecventaRespiratorie      INT              = NULL,
    @Temperatura                DECIMAL(4,1)     = NULL,
    @SpO2                       INT              = NULL,
    @Edeme                      NVARCHAR(50)     = NULL,
    @Glicemie                   DECIMAL(6,1)     = NULL,
    @GanglioniLimfatici         NVARCHAR(100)    = NULL,
    @ExamenClinic               NVARCHAR(MAX)    = NULL,
    @AlteObservatiiClinice      NVARCHAR(MAX)    = NULL,
    -- Tab 3: Investigații
    @Investigatii               NVARCHAR(MAX)    = NULL,
    -- Tab 4: Analize Medicale
    @AnalizeMedicale            NVARCHAR(MAX)    = NULL,
    -- Tab 5: Diagnostic & Tratament
    @Diagnostic                 NVARCHAR(MAX)    = NULL,
    @DiagnosticCodes            NVARCHAR(MAX)    = NULL,
    @Recomandari                NVARCHAR(MAX)    = NULL,
    @Observatii                 NVARCHAR(MAX)    = NULL,
    -- Tab 6: Concluzii
    @Concluzii                  NVARCHAR(MAX)    = NULL,
    @EsteAfectiuneOncologica    BIT              = 0,
    @AreIndicatieInternare      BIT              = 0,
    @SaEliberatPrescriptie      BIT              = 0,
    @SeriePrescriptie           NVARCHAR(100)    = NULL,
    @SaEliberatConcediuMedical  BIT              = 0,
    @SerieConcediuMedical       NVARCHAR(100)    = NULL,
    @SaEliberatIngrijiriDomiciliu  BIT           = 0,
    @SaEliberatDispozitiveMedicale BIT           = 0,
    @DataUrmatoareiVizite       DATE             = NULL,
    @NoteUrmatoareaVizita       NVARCHAR(MAX)    = NULL,
    @StatusId                   UNIQUEIDENTIFIER = NULL,
    @CreatedBy                  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Default status: În lucru
    IF @StatusId IS NULL
        SET @StatusId = 'C2000000-0000-0000-0000-000000000001';

    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

    INSERT INTO dbo.Consultations
        (Id, ClinicId, PatientId, DoctorId, AppointmentId, Date,
         Motiv, IstoricMedicalPersonal, TratamentAnterior, IstoricBoalaActuala,
         IstoricFamilial, FactoriDeRisc, AlergiiConsultatie,
         StareGenerala, Tegumente, Mucoase, Greutate, Inaltime,
         TensiuneSistolica, TensiuneDiastolica, Puls, FrecventaRespiratorie,
         Temperatura, SpO2, Edeme, Glicemie, GanglioniLimfatici,
         ExamenClinic, AlteObservatiiClinice,
         Investigatii, AnalizeMedicale,
         Diagnostic, DiagnosticCodes, Recomandari, Observatii,
         Concluzii, EsteAfectiuneOncologica, AreIndicatieInternare,
         SaEliberatPrescriptie, SeriePrescriptie,
         SaEliberatConcediuMedical, SerieConcediuMedical,
         SaEliberatIngrijiriDomiciliu, SaEliberatDispozitiveMedicale,
         DataUrmatoareiVizite, NoteUrmatoareaVizita,
         StatusId, CreatedBy)
    VALUES
        (@NewId, @ClinicId, @PatientId, @DoctorId, @AppointmentId, @Date,
         @Motiv, @IstoricMedicalPersonal, @TratamentAnterior, @IstoricBoalaActuala,
         @IstoricFamilial, @FactoriDeRisc, @AlergiiConsultatie,
         @StareGenerala, @Tegumente, @Mucoase, @Greutate, @Inaltime,
         @TensiuneSistolica, @TensiuneDiastolica, @Puls, @FrecventaRespiratorie,
         @Temperatura, @SpO2, @Edeme, @Glicemie, @GanglioniLimfatici,
         @ExamenClinic, @AlteObservatiiClinice,
         @Investigatii, @AnalizeMedicale,
         @Diagnostic, @DiagnosticCodes, @Recomandari, @Observatii,
         @Concluzii, @EsteAfectiuneOncologica, @AreIndicatieInternare,
         @SaEliberatPrescriptie, @SeriePrescriptie,
         @SaEliberatConcediuMedical, @SerieConcediuMedical,
         @SaEliberatIngrijiriDomiciliu, @SaEliberatDispozitiveMedicale,
         @DataUrmatoareiVizite, @NoteUrmatoareaVizita,
         @StatusId, @CreatedBy);

    -- Audit
    DECLARE @NewValues NVARCHAR(MAX);
    SELECT @NewValues = (
        SELECT PatientId, DoctorId, AppointmentId, Date, StatusId
        FROM dbo.Consultations WHERE Id = @NewId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'Consultation', @NewId, N'Create', NULL, @NewValues, @CreatedBy);

    SELECT @NewId;
END;
GO
