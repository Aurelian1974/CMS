SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_Update
-- Descriere: Actualizează o programare. Validează tenancy, status + tranziție,
--            concurență optimistă (RowVersion), program de lucru și conflictul
--            de orar în tranzacție (UPDLOCK, HOLDLOCK).
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_Update
    @Id              UNIQUEIDENTIFIER,
    @ClinicId        UNIQUEIDENTIFIER,
    @PatientId       UNIQUEIDENTIFIER,
    @DoctorId        UNIQUEIDENTIFIER,
    @StartTime       DATETIME2(0),
    @EndTime         DATETIME2(0),
    @StatusId        UNIQUEIDENTIFIER = NULL,
    @Notes           NVARCHAR(2000)   = NULL,
    @EnforceSchedule BIT              = 1,
    @RowVersion      BINARY(8)        = NULL,   -- NULL = fără verificare de concurență
    @UpdatedBy       UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF @EndTime <= @StartTime
    BEGIN
        ;THROW 50018, N'Ora de sfârșit trebuie să fie după ora de început.', 1;
    END;

    BEGIN TRANSACTION;

        DECLARE @CurStatusId  UNIQUEIDENTIFIER,
                @CurPatientId UNIQUEIDENTIFIER,
                @CurDoctorId  UNIQUEIDENTIFIER,
                @CurStart     DATETIME2(0),
                @CurEnd       DATETIME2(0),
                @CurRowVer    BINARY(8),
                @OldValues    NVARCHAR(MAX);

        SELECT @CurStatusId  = StatusId,
               @CurPatientId = PatientId,
               @CurDoctorId  = DoctorId,
               @CurStart     = StartTime,
               @CurEnd       = EndTime,
               @CurRowVer    = RowVersion,
               @OldValues    = (SELECT a.PatientId, a.DoctorId, a.StartTime, a.EndTime, a.StatusId, a.Notes
                                FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        FROM dbo.Appointments a WITH (UPDLOCK)
        WHERE a.Id = @Id AND a.ClinicId = @ClinicId AND a.IsDeleted = 0;

        IF @CurStatusId IS NULL
        BEGIN
            ;THROW 50011, N'Programarea nu a fost găsită.', 1;
        END;

        IF @RowVersion IS NOT NULL AND @RowVersion <> @CurRowVer
        BEGIN
            ;THROW 50019, N'Programarea a fost modificată de alt utilizator. Reîncarcă datele.', 1;
        END;

        SET @StatusId = ISNULL(@StatusId, @CurStatusId);

        -- Multi-tenancy; pacientul/doctorul deja asociat rămâne valid chiar dacă a fost dezactivat
        IF NOT EXISTS (SELECT 1 FROM dbo.Patients
                       WHERE Id = @PatientId AND ClinicId = @ClinicId
                         AND (IsDeleted = 0 OR Id = @CurPatientId))
        BEGIN
            ;THROW 50012, N'Pacientul nu a fost găsit.', 1;
        END;

        IF NOT EXISTS (SELECT 1 FROM dbo.Doctors
                       WHERE Id = @DoctorId AND ClinicId = @ClinicId
                         AND (IsDeleted = 0 OR Id = @CurDoctorId))
        BEGIN
            ;THROW 50013, N'Doctorul nu a fost găsit.', 1;
        END;

        IF @StatusId <> @CurStatusId
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentStatuses WHERE Id = @StatusId AND IsActive = 1)
            BEGIN
                ;THROW 50014, N'Statusul selectat nu este valid.', 1;
            END;

            IF EXISTS (SELECT 1 FROM dbo.Consultations
                       WHERE AppointmentId = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
            BEGIN
                ;THROW 50015, N'Programarea are o consultație începută — starea se actualizează automat la finalizarea consultației.', 1;
            END;

            IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentStatusTransitions
                           WHERE FromStatusId = @CurStatusId AND ToStatusId = @StatusId)
            BEGIN
                ;THROW 50017, N'Tranziția de status nu este permisă.', 1;
            END;
        END;

        DECLARE @SlotChanged BIT =
            CASE WHEN @StartTime <> @CurStart OR @EndTime <> @CurEnd OR @DoctorId <> @CurDoctorId
                 THEN 1 ELSE 0 END;

        IF @SlotChanged = 1 AND EXISTS (
            SELECT 1
            FROM dbo.Consultations c
            INNER JOIN dbo.ConsultationStatuses cs ON cs.Id = c.StatusId
            WHERE c.AppointmentId = @Id
              AND c.ClinicId = @ClinicId
              AND c.IsDeleted = 0
              AND cs.Code IN ('FINALIZATA', 'BLOCATA'))
        BEGIN
            ;THROW 50015, N'Programarea are o consultație finalizată — intervalul nu mai poate fi modificat.', 1;
        END;

        -- Programul de lucru se verifică doar când se mută slotul (datele istorice rămân editabile)
        IF @EnforceSchedule = 1 AND @SlotChanged = 1
        BEGIN
            IF CAST(@StartTime AS DATE) <> CAST(@EndTime AS DATE)
            BEGIN
                ;THROW 50016, N'Programarea trebuie să se încheie în aceeași zi.', 1;
            END;

            -- 1900-01-01 a fost luni → 1=Luni..7=Duminică, independent de SET DATEFIRST
            DECLARE @Dow    TINYINT = (DATEDIFF(DAY, '19000101', CAST(@StartTime AS DATE)) % 7) + 1;
            DECLARE @StartT TIME(0) = CAST(@StartTime AS TIME(0));
            DECLARE @EndT   TIME(0) = CAST(@EndTime   AS TIME(0));

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

        -- Conflictul contează doar dacă noul status ocupă slotul (ANULAT nu are nevoie de slot liber)
        IF EXISTS (SELECT 1 FROM dbo.AppointmentStatuses WHERE Id = @StatusId AND BlocksSlot = 1)
           AND EXISTS (
                SELECT 1
                FROM dbo.Appointments a WITH (UPDLOCK, HOLDLOCK)
                INNER JOIN dbo.AppointmentStatuses s ON s.Id = a.StatusId
                WHERE a.ClinicId   = @ClinicId
                  AND a.DoctorId   = @DoctorId
                  AND a.Id        <> @Id
                  AND a.IsDeleted  = 0
                  AND s.BlocksSlot = 1
                  AND a.StartTime  < @EndTime
                  AND a.EndTime    > @StartTime)
        BEGIN
            ;THROW 50010, N'Există deja o programare în acest interval orar pentru acest doctor.', 1;
        END;

        UPDATE dbo.Appointments SET
            PatientId = @PatientId,
            DoctorId  = @DoctorId,
            StartTime = @StartTime,
            EndTime   = @EndTime,
            StatusId  = @StatusId,
            Notes     = @Notes,
            UpdatedAt = SYSDATETIME(),
            UpdatedBy = @UpdatedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        DECLARE @NewValues NVARCHAR(MAX) = (
            SELECT PatientId, DoctorId, StartTime, EndTime, StatusId, Notes
            FROM dbo.Appointments WHERE Id = @Id AND ClinicId = @ClinicId
            FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
        );

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (@ClinicId, N'Appointment', @Id, N'Update', @OldValues, @NewValues, @UpdatedBy);

    COMMIT TRANSACTION;
END;
GO
