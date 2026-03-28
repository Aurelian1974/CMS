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
END;
GO
