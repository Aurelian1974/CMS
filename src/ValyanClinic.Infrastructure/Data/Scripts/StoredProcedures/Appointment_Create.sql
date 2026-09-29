SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_Create
-- Descriere: Creează o programare nouă. Validează tenancy, status, program de
--            lucru și conflictul de orar în tranzacție (UPDLOCK, HOLDLOCK).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_Create
    @ClinicId        UNIQUEIDENTIFIER,
    @PatientId       UNIQUEIDENTIFIER,
    @DoctorId        UNIQUEIDENTIFIER,
    @StartTime       DATETIME2(0),
    @EndTime         DATETIME2(0),
    @StatusId        UNIQUEIDENTIFIER = NULL,
    @Notes           NVARCHAR(2000)   = NULL,
    @EnforceSchedule BIT              = 1,
    @CreatedBy       UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @EndTime <= @StartTime
    BEGIN
        ;THROW 50018, N'Ora de sfârșit trebuie să fie după ora de început.', 1;
    END;

    IF @StatusId IS NULL
        SET @StatusId = 'A1000000-0000-0000-0000-000000000001';   -- PROGRAMAT

    -- Multi-tenancy: pacientul și doctorul trebuie să aparțină clinicii curente
    IF NOT EXISTS (SELECT 1 FROM dbo.Patients
                   WHERE Id = @PatientId AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50012, N'Pacientul nu a fost găsit.', 1;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.Doctors
                   WHERE Id = @DoctorId AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50013, N'Doctorul nu a fost găsit.', 1;
    END;

    IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentStatuses
                   WHERE Id = @StatusId AND IsActive = 1)
    BEGIN
        ;THROW 50014, N'Statusul selectat nu este valid.', 1;
    END;

    IF EXISTS (SELECT 1 FROM dbo.AppointmentStatuses WHERE Id = @StatusId AND Code = 'FINALIZAT')
    BEGIN
        ;THROW 50017, N'Programarea se finalizează automat, la finalizarea consultației.', 1;
    END;

    IF @EnforceSchedule = 1
    BEGIN
        IF CAST(@StartTime AS DATE) <> CAST(@EndTime AS DATE)
        BEGIN
            ;THROW 50016, N'Programarea trebuie să se încheie în aceeași zi.', 1;
        END;

        -- 1900-01-01 a fost luni → 1=Luni..7=Duminică, independent de SET DATEFIRST
        DECLARE @Dow    TINYINT = (DATEDIFF(DAY, '19000101', CAST(@StartTime AS DATE)) % 7) + 1;
        DECLARE @StartT TIME(0) = CAST(@StartTime AS TIME(0));
        DECLARE @EndT   TIME(0) = CAST(@EndTime   AS TIME(0));

        -- Programul se aplică doar dacă este configurat (clinică / doctor)
        IF EXISTS (SELECT 1 FROM dbo.ClinicSchedule WHERE ClinicId = @ClinicId)
           AND NOT EXISTS (
                SELECT 1 FROM dbo.ClinicSchedule cs
                WHERE cs.ClinicId = @ClinicId AND cs.DayOfWeek = @Dow AND cs.IsOpen = 1
                  AND cs.OpenTime IS NOT NULL AND cs.CloseTime IS NOT NULL
                  AND @StartT >= cs.OpenTime AND @EndT <= cs.CloseTime)
        BEGIN
            ;THROW 50016, N'Intervalul este în afara programului clinicii.', 1;
        END;

        IF EXISTS (SELECT 1 FROM dbo.DoctorSchedule WHERE DoctorId = @DoctorId AND ClinicId = @ClinicId)
           AND NOT EXISTS (
                SELECT 1 FROM dbo.DoctorSchedule ds
                WHERE ds.DoctorId = @DoctorId AND ds.ClinicId = @ClinicId AND ds.DayOfWeek = @Dow
                  AND @StartT >= ds.StartTime AND @EndT <= ds.EndTime)
        BEGIN
            ;THROW 50016, N'Intervalul este în afara programului doctorului.', 1;
        END;
    END;

    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

    BEGIN TRANSACTION;

        -- UPDLOCK + HOLDLOCK: range lock pe interval → serializează cererile concurente
        IF EXISTS (
            SELECT 1
            FROM dbo.Appointments a WITH (UPDLOCK, HOLDLOCK)
            INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
            WHERE a.ClinicId   = @ClinicId
              AND a.DoctorId   = @DoctorId
              AND a.IsDeleted  = 0
              AND s.BlocksSlot = 1
              AND a.StartTime  < @EndTime
              AND a.EndTime    > @StartTime
        )
        BEGIN
            ;THROW 50010, N'Există deja o programare în acest interval orar pentru acest doctor.', 1;
        END;

        INSERT INTO dbo.Appointments
            (Id, ClinicId, PatientId, DoctorId, StartTime, EndTime, StatusId, Notes, CreatedBy)
        VALUES
            (@NewId, @ClinicId, @PatientId, @DoctorId, @StartTime, @EndTime, @StatusId, @Notes, @CreatedBy);

        DECLARE @NewValues NVARCHAR(MAX) = (
            SELECT PatientId, DoctorId, StartTime, EndTime, StatusId, Notes
            FROM dbo.Appointments WHERE Id = @NewId
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Appointment', @NewId, N'Create', NULL, @NewValues, @CreatedBy);

    COMMIT TRANSACTION;

    SELECT @NewId;
END;
GO
