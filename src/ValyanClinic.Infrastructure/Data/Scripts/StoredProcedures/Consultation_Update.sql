SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Consultation_Update
-- Descriere: Actualizează o consultație existentă (nu permite update pe cele blocate)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_Update
    @Id                         UNIQUEIDENTIFIER,
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
    @UpdatedBy                  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Consultations WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50020, N'Consultația nu a fost găsită.', 1;
    END;

    -- Nu permite modificarea consultațiilor blocate
    IF EXISTS (
        SELECT 1 FROM dbo.Consultations c
        INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
        WHERE c.Id = @Id AND c.ClinicId = @ClinicId AND s.Code = 'BLOCATA'
    )
    BEGIN
        ;THROW 50021, N'Consultația este blocată și nu poate fi modificată.', 1;
    END;

    -- Audit: captează valorile vechi ÎNAINTE de update
    DECLARE @OldValues NVARCHAR(MAX);
    SELECT @OldValues = (
        SELECT PatientId, DoctorId, AppointmentId, Date, StatusId
        FROM dbo.Consultations WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    UPDATE dbo.Consultations SET
        PatientId                   = @PatientId,
        DoctorId                    = @DoctorId,
        AppointmentId               = @AppointmentId,
        Date                        = @Date,
        Motiv                       = @Motiv,
        IstoricMedicalPersonal      = @IstoricMedicalPersonal,
        TratamentAnterior           = @TratamentAnterior,
        IstoricBoalaActuala         = @IstoricBoalaActuala,
        IstoricFamilial             = @IstoricFamilial,
        FactoriDeRisc               = @FactoriDeRisc,
        AlergiiConsultatie          = @AlergiiConsultatie,
        StareGenerala               = @StareGenerala,
        Tegumente                   = @Tegumente,
        Mucoase                     = @Mucoase,
        Greutate                    = @Greutate,
        Inaltime                    = @Inaltime,
        TensiuneSistolica           = @TensiuneSistolica,
        TensiuneDiastolica          = @TensiuneDiastolica,
        Puls                        = @Puls,
        FrecventaRespiratorie       = @FrecventaRespiratorie,
        Temperatura                 = @Temperatura,
        SpO2                        = @SpO2,
        Edeme                       = @Edeme,
        Glicemie                    = @Glicemie,
        GanglioniLimfatici          = @GanglioniLimfatici,
        ExamenClinic                = @ExamenClinic,
        AlteObservatiiClinice       = @AlteObservatiiClinice,
        Investigatii                = @Investigatii,
        AnalizeMedicale             = @AnalizeMedicale,
        Diagnostic                  = @Diagnostic,
        DiagnosticCodes             = @DiagnosticCodes,
        Recomandari                 = @Recomandari,
        Observatii                  = @Observatii,
        Concluzii                   = @Concluzii,
        EsteAfectiuneOncologica     = @EsteAfectiuneOncologica,
        AreIndicatieInternare       = @AreIndicatieInternare,
        SaEliberatPrescriptie       = @SaEliberatPrescriptie,
        SeriePrescriptie            = @SeriePrescriptie,
        SaEliberatConcediuMedical   = @SaEliberatConcediuMedical,
        SerieConcediuMedical        = @SerieConcediuMedical,
        SaEliberatIngrijiriDomiciliu   = @SaEliberatIngrijiriDomiciliu,
        SaEliberatDispozitiveMedicale  = @SaEliberatDispozitiveMedicale,
        DataUrmatoareiVizite        = @DataUrmatoareiVizite,
        NoteUrmatoareaVizita        = @NoteUrmatoareaVizita,
        StatusId                    = ISNULL(@StatusId, StatusId),
        UpdatedAt                   = SYSDATETIME(),
        UpdatedBy                   = @UpdatedBy
    WHERE Id = @Id AND ClinicId = @ClinicId;

    -- Audit: captează valorile noi DUPĂ update
    DECLARE @NewValues NVARCHAR(MAX);
    SELECT @NewValues = (
        SELECT PatientId, DoctorId, AppointmentId, Date, StatusId
        FROM dbo.Consultations WHERE Id = @Id AND ClinicId = @ClinicId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'Consultation', @Id, N'Update', @OldValues, @NewValues, @UpdatedBy);
END;
GO
