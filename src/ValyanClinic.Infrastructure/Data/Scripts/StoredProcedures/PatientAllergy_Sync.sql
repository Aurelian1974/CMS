-- ============================================================
-- PatientAllergy_Sync — sincronizare alergii pacient
-- Șterge cele vechi (dezactivează) și inserează cele noi
-- ============================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.PatientAllergy_Sync
    @PatientId UNIQUEIDENTIFIER,
    @CreatedBy UNIQUEIDENTIFIER,
    @Allergies dbo.PatientAllergyTableType READONLY
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Dezactivăm toate alergiile existente
        UPDATE PatientAllergies
        SET IsActive = 0
        WHERE PatientId = @PatientId AND IsActive = 1;

        -- Inserăm noile alergii
        INSERT INTO PatientAllergies (
            PatientId, AllergyTypeId, AllergySeverityId,
            AllergenName, Reaction, OnsetDate, Notes,
            IsActive, CreatedAt, CreatedBy
        )
        SELECT
            @PatientId, AllergyTypeId, AllergySeverityId,
            AllergenName, Reaction, OnsetDate, Notes,
            1, GETDATE(), @CreatedBy
        FROM @Allergies;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
