-- ============================================================
-- PatientDoctor_Sync — sincronizare doctori asignați pacientului
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.PatientDoctor_Sync
    @PatientId UNIQUEIDENTIFIER,
    @CreatedBy UNIQUEIDENTIFIER,
    @Doctors   dbo.PatientDoctorTableType READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Dezactivăm toate asignările existente
        UPDATE PatientDoctors
        SET IsActive = 0
        WHERE PatientId = @PatientId AND IsActive = 1;

        -- Inserăm noile asignări (sau reactivăm dacă există deja combo-ul)
        MERGE PatientDoctors AS target
        USING @Doctors AS source
        ON target.PatientId = @PatientId AND target.DoctorId = source.DoctorId
        WHEN MATCHED THEN
            UPDATE SET
                IsPrimary  = source.IsPrimary,
                Notes      = source.Notes,
                IsActive   = 1,
                AssignedAt = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (PatientId, DoctorId, IsPrimary, AssignedAt, Notes, IsActive, CreatedBy)
            VALUES (@PatientId, source.DoctorId, source.IsPrimary, GETDATE(), source.Notes, 1, @CreatedBy);

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
