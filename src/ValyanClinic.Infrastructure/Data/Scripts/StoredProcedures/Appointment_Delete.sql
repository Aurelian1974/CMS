SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_Delete
-- Descriere: Soft-delete programare (IsDeleted = 1)
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_Delete
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @DeletedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Appointments WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50011, N'Programarea nu a fost găsită.', 1;
    END;

    -- O programare cu consultație activă nu se șterge (Consultations.AppointmentId ar rămâne orfan)
    IF EXISTS (SELECT 1 FROM dbo.Consultations
               WHERE AppointmentId = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50015, N'Programarea are o consultație asociată și nu poate fi ștearsă. Anulează-o în schimb.', 1;
    END;

    -- Audit: captează valorile vechi ÎNAINTE de ștergere
    DECLARE @OldValues NVARCHAR(MAX);
    SELECT @OldValues = (
        SELECT PatientId, DoctorId, StartTime, EndTime, StatusId, Notes
        FROM dbo.Appointments WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0
        FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
    );

    UPDATE dbo.Appointments SET
        IsDeleted = 1,
        UpdatedAt = SYSDATETIME(),
        UpdatedBy = @DeletedBy
    WHERE Id = @Id AND ClinicId = @ClinicId;

    INSERT INTO dbo.AuditLogs (ClinicId, EntityType, EntityId, Action, OldValues, NewValues, ChangedBy)
    VALUES (@ClinicId, N'Appointment', @Id, N'Delete', @OldValues, NULL, @DeletedBy);
END;
GO
