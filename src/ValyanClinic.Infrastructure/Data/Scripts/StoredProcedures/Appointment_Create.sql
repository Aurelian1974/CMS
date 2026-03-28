SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_Create
-- Descriere: Creează o programare nouă; verifică conflicte de orar
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_Create
    @ClinicId   UNIQUEIDENTIFIER,
    @PatientId  UNIQUEIDENTIFIER,
    @DoctorId   UNIQUEIDENTIFIER,
    @StartTime  DATETIME2(0),
    @EndTime    DATETIME2(0),
    @StatusId   UNIQUEIDENTIFIER = NULL,
    @Notes      NVARCHAR(2000) = NULL,
    @CreatedBy  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    -- Default status: Programat
    IF @StatusId IS NULL
        SET @StatusId = 'A1000000-0000-0000-0000-000000000001';

    -- Verificare conflict orar (același doctor, interval suprapus)
    IF EXISTS (
        SELECT 1 FROM dbo.Appointments
        WHERE ClinicId = @ClinicId
          AND DoctorId = @DoctorId
          AND IsDeleted = 0
          AND StartTime < @EndTime
          AND EndTime > @StartTime
    )
    BEGIN
        ;THROW 50010, N'Există deja o programare în acest interval orar pentru acest doctor.', 1;
    END;

    DECLARE @NewId UNIQUEIDENTIFIER = NEWID();

    INSERT INTO dbo.Appointments (Id, ClinicId, PatientId, DoctorId, StartTime, EndTime, StatusId, Notes, CreatedBy)
    VALUES (@NewId, @ClinicId, @PatientId, @DoctorId, @StartTime, @EndTime, @StatusId, @Notes, @CreatedBy);

    -- Audit: captează valorile create
    DECLARE @NewValues NVARCHAR(MAX);
    SELECT @NewValues = (
        SELECT PatientId, DoctorId, StartTime, EndTime, StatusId, Notes
        FROM dbo.Appointments WHERE Id = @NewId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'Appointment', @NewId, N'Create', NULL, @NewValues, @CreatedBy);

    SELECT @NewId;
END;
GO
