SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_Update
-- Descriere: Actualizează o programare; verifică conflicte de orar
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_Update
    @Id         UNIQUEIDENTIFIER,
    @ClinicId   UNIQUEIDENTIFIER,
    @PatientId  UNIQUEIDENTIFIER,
    @DoctorId   UNIQUEIDENTIFIER,
    @StartTime  DATETIME2(0),
    @EndTime    DATETIME2(0),
    @StatusId   UNIQUEIDENTIFIER = NULL,
    @Notes      NVARCHAR(2000) = NULL,
    @UpdatedBy  UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Appointments WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50011, N'Programarea nu a fost găsită.', 1;
    END;

    -- Verificare conflict orar (exclude programarea curentă)
    IF EXISTS (
        SELECT 1 FROM dbo.Appointments
        WHERE ClinicId = @ClinicId
          AND DoctorId = @DoctorId
          AND Id <> @Id
          AND IsDeleted = 0
          AND StartTime < @EndTime
          AND EndTime > @StartTime
    )
    BEGIN
        ;THROW 50010, N'Există deja o programare în acest interval orar pentru acest doctor.', 1;
    END;

    -- Audit: captează valorile vechi ÎNAINTE de update
    DECLARE @OldValues NVARCHAR(MAX);
    SELECT @OldValues = (
        SELECT PatientId, DoctorId, StartTime, EndTime, StatusId, Notes
        FROM dbo.Appointments WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    UPDATE dbo.Appointments SET
        PatientId = @PatientId,
        DoctorId  = @DoctorId,
        StartTime = @StartTime,
        EndTime   = @EndTime,
        StatusId  = ISNULL(@StatusId, StatusId),
        Notes     = @Notes,
        UpdatedAt = SYSDATETIME(),
        UpdatedBy = @UpdatedBy
    WHERE Id = @Id AND ClinicId = @ClinicId;

    -- Audit: captează valorile noi DUPĂ update
    DECLARE @NewValues NVARCHAR(MAX);
    SELECT @NewValues = (
        SELECT PatientId, DoctorId, StartTime, EndTime, StatusId, Notes
        FROM dbo.Appointments WHERE Id = @Id AND ClinicId = @ClinicId
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'Appointment', @Id, N'Update', @OldValues, @NewValues, @UpdatedBy);
END;
GO
