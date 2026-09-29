SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Consultation_Update
-- Descriere: Actualizează header-ul unei consultații + tab-urile încă pe
-- coloane vechi (Investigații/Analize/Diagnostic/Concluzii).
-- Anamneză și Examen Clinic se actualizează prin SP-urile dedicate Upsert.
-- Permis doar pe consultații în lucru (INLUCRU).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Consultation_Update
    @Id                         UNIQUEIDENTIFIER,
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
    @UpdatedBy                  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @StatusCode NVARCHAR(50);

    -- UPDLOCK: o finalizare concurentă nu poate schimba statusul între verificare și scriere
    SELECT @StatusCode = s.Code
    FROM dbo.Consultations c WITH (UPDLOCK, HOLDLOCK)
    INNER JOIN dbo.ConsultationStatuses s ON s.Id = c.StatusId
    WHERE c.Id = @Id AND c.ClinicId = @ClinicId AND c.IsDeleted = 0;

    IF @StatusCode IS NULL
    BEGIN
        ;THROW 50020, N'Consultația nu a fost găsită.', 1;
    END;

    -- FINALIZATA / FACTURATA / BLOCATA sunt read-only pe server, nu doar în UI;
    -- statusul se schimbă exclusiv prin fluxurile dedicate (finalizare, facturare, blocare)
    IF @StatusCode <> 'INLUCRU'
    BEGIN
        ;THROW 50021, N'Consultația nu mai este în lucru și nu poate fi modificată.', 1;
    END;

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

        IF EXISTS (SELECT 1 FROM dbo.Consultations WITH (UPDLOCK, HOLDLOCK)
                   WHERE AppointmentId = @AppointmentId AND IsDeleted = 0 AND Id <> @Id)
        BEGIN
            ;THROW 50033, N'Există deja o consultație pentru această programare.', 1;
        END;

        -- Doar o legătură nouă cere programare confirmată; cea existentă rămâne validă
        IF NOT EXISTS (SELECT 1 FROM dbo.Consultations
                       WHERE Id = @Id AND ClinicId = @ClinicId AND AppointmentId = @AppointmentId)
           AND NOT EXISTS (SELECT 1 FROM dbo.Appointments a
                           INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
                           WHERE a.Id = @AppointmentId AND a.ClinicId = @ClinicId AND s.Code = 'CONFIRMAT')
        BEGIN
            ;THROW 50035, N'Consultația poate fi începută doar pentru o programare confirmată.', 1;
        END;
    END;

    DECLARE @OldValues NVARCHAR(MAX);
    SELECT @OldValues = (
        SELECT PatientId, DoctorId, AppointmentId, Date, StatusId, DiagnosticCodes
        FROM dbo.Consultations WHERE Id = @Id AND ClinicId = @ClinicId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    UPDATE dbo.Consultations SET
        PatientId                   = @PatientId,
        DoctorId                    = @DoctorId,
        AppointmentId               = @AppointmentId,
        Date                        = @Date,
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
        UpdatedAt                   = SYSDATETIME(),
        UpdatedBy                   = @UpdatedBy
    WHERE Id = @Id AND ClinicId = @ClinicId;

    EXEC dbo.ConsultationDiagnosis_SyncFromJson
        @ConsultationId = @Id, @ClinicId = @ClinicId,
        @Diagnostic = @Diagnostic, @UserId = @UpdatedBy;

    DECLARE @NewValues NVARCHAR(MAX);
    SELECT @NewValues = (
        SELECT PatientId, DoctorId, AppointmentId, Date, StatusId, DiagnosticCodes
        FROM dbo.Consultations WHERE Id = @Id AND ClinicId = @ClinicId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'Consultation', @Id, N'Update', @OldValues, @NewValues, @UpdatedBy);

    COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
