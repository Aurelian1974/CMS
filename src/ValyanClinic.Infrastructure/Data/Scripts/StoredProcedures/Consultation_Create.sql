SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Consultation_Create
-- Descriere: Creează o consultație nouă (header). Sub-secțiunile (Anamneză,
-- Examen Clinic) se inserează ulterior prin SP-uri dedicate Upsert*.
-- Tab-urile încă necefactorizate (Investigații/Analize/Diagnostic/Concluzii)
-- rămân pe coloane în Consultations.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_Create
    @ClinicId                   UNIQUEIDENTIFIER,
    @PatientId                  UNIQUEIDENTIFIER,
    @DoctorId                   UNIQUEIDENTIFIER,
    @AppointmentId              UNIQUEIDENTIFIER = NULL,
    @Date                       DATETIME2(0),
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
    @CreatedBy                  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
    BEGIN TRANSACTION;

    -- Cheile străine garantează doar existența rândului, nu apartenența la clinică
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

    IF @AppointmentId IS NOT NULL
    BEGIN
        IF NOT EXISTS (SELECT 1 FROM dbo.Appointments
                       WHERE Id = @AppointmentId AND ClinicId = @ClinicId AND IsDeleted = 0
                         AND PatientId = @PatientId)
        BEGIN
            ;THROW 50011, N'Programarea nu a fost găsită.', 1;
        END;

        -- UPDLOCK/HOLDLOCK: două taburi pe aceeași programare nu pot trece amândouă de verificare
        IF EXISTS (SELECT 1 FROM dbo.Consultations WITH (UPDLOCK, HOLDLOCK)
                   WHERE AppointmentId = @AppointmentId AND IsDeleted = 0)
        BEGIN
            ;THROW 50033, N'Există deja o consultație pentru această programare.', 1;
        END;
    END;

    -- Statusul inițial e mereu „În lucru"; finalizarea trece prin Consultation_Finalize
    DECLARE @StatusId UNIQUEIDENTIFIER =
        (SELECT Id FROM dbo.ConsultationStatuses WHERE Code = 'INLUCRU');

    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

    INSERT INTO dbo.Consultations
        (Id, ClinicId, PatientId, DoctorId, AppointmentId, Date,
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
         @Investigatii, @AnalizeMedicale,
         @Diagnostic, @DiagnosticCodes, @Recomandari, @Observatii,
         @Concluzii, @EsteAfectiuneOncologica, @AreIndicatieInternare,
         @SaEliberatPrescriptie, @SeriePrescriptie,
         @SaEliberatConcediuMedical, @SerieConcediuMedical,
         @SaEliberatIngrijiriDomiciliu, @SaEliberatDispozitiveMedicale,
         @DataUrmatoareiVizite, @NoteUrmatoareaVizita,
         @StatusId, @CreatedBy);

    EXEC dbo.ConsultationDiagnosis_SyncFromJson
        @ConsultationId = @NewId, @ClinicId = @ClinicId,
        @Diagnostic = @Diagnostic, @UserId = @CreatedBy;

    -- Audit
    DECLARE @NewValues NVARCHAR(MAX);
    SELECT @NewValues = (
        SELECT PatientId, DoctorId, AppointmentId, Date, StatusId, DiagnosticCodes
        FROM dbo.Consultations WHERE Id = @NewId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'Consultation', @NewId, N'Create', NULL, @NewValues, @CreatedBy);

    COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;

    SELECT @NewId;
END;
GO
