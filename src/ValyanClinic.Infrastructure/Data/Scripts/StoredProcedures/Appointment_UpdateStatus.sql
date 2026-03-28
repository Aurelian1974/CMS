SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: Appointment_UpdateStatus
-- Descriere: Actualizează statusul unei programări
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Appointment_UpdateStatus
    @Id        UNIQUEIDENTIFIER,
    @ClinicId  UNIQUEIDENTIFIER,
    @StatusId  UNIQUEIDENTIFIER,
    @UpdatedBy UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.Appointments WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
    BEGIN
        ;THROW 50011, N'Programarea nu a fost găsită.', 1;
    END;

    UPDATE dbo.Appointments SET
        StatusId  = @StatusId,
        UpdatedAt = SYSDATETIME(),
        UpdatedBy = @UpdatedBy
    WHERE Id = @Id AND ClinicId = @ClinicId;
END;
GO
