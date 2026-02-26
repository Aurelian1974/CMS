-- ============================================================
-- PatientEmergencyContact_Sync — sincronizare contacte urgență
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.PatientEmergencyContact_Sync
    @PatientId UNIQUEIDENTIFIER,
    @CreatedBy UNIQUEIDENTIFIER,
    @Contacts  dbo.PatientEmergencyContactTableType READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Dezactivăm toate contactele existente
        UPDATE PatientEmergencyContacts
        SET IsActive = 0
        WHERE PatientId = @PatientId AND IsActive = 1;

        -- Inserăm noile contacte
        INSERT INTO PatientEmergencyContacts (
            PatientId, FullName, Relationship, PhoneNumber,
            IsDefault, Notes, IsActive, CreatedAt, CreatedBy
        )
        SELECT
            @PatientId, FullName, Relationship, PhoneNumber,
            IsDefault, Notes, 1, GETDATE(), @CreatedBy
        FROM @Contacts;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
