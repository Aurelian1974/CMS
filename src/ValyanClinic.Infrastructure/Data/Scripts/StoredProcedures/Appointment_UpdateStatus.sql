SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_UpdateStatus
-- Descriere: Schimbă statusul unei programări conform matricei de tranziții;
--            la reactivare reverifică slotul; scrie audit.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_UpdateStatus
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @StatusId  UNIQUEIDENTIFIER,
    @UpdatedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.AppointmentStatuses WHERE Id = @StatusId AND IsActive = 1)
    BEGIN
        ;THROW 50014, N'Statusul selectat nu este valid.', 1;
    END;

    BEGIN TRANSACTION;

        DECLARE @CurStatusId UNIQUEIDENTIFIER,
                @DoctorId    UNIQUEIDENTIFIER,
                @StartTime   DATETIME2(0),
                @EndTime     DATETIME2(0);

        SELECT @CurStatusId = StatusId, @DoctorId = DoctorId,
               @StartTime = StartTime, @EndTime = EndTime
        FROM dbo.Appointments WITH (UPDLOCK)
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        IF @CurStatusId IS NULL
        BEGIN
            ;THROW 50011, N'Programarea nu a fost găsită.', 1;
        END;

        -- Idempotent: același status → no-op, fără audit
        IF @StatusId = @CurStatusId
        BEGIN
            COMMIT TRANSACTION;
            RETURN;
        END;

        -- Cu o consultație începută, starea e condusă de consultație (Consultation_Finalize)
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

        -- Reactivare (ANULAT/NEPREZENTARE → PROGRAMAT): slotul poate fi ocupat între timp
        IF EXISTS (SELECT 1 FROM dbo.AppointmentStatuses WHERE Id = @StatusId    AND BlocksSlot = 1)
           AND EXISTS (SELECT 1 FROM dbo.AppointmentStatuses WHERE Id = @CurStatusId AND BlocksSlot = 0)
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
            ;THROW 50010, N'Slotul a fost ocupat între timp de o altă programare.', 1;
        END;

        UPDATE dbo.Appointments SET
            StatusId  = @StatusId,
            UpdatedAt = SYSDATETIME(),
            UpdatedBy = @UpdatedBy
        WHERE Id = @Id AND ClinicId = @ClinicId;

        INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
        VALUES (
            @ClinicId, N'Appointment', @Id, N'UpdateStatus',
            (SELECT @CurStatusId AS StatusId FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT @StatusId    AS StatusId FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            @UpdatedBy);

    COMMIT TRANSACTION;
END;
GO
