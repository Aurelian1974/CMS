-- ============================================================================
-- SP: MedicalTitle_ToggleActive
-- Descriere: Activează / dezactivează o titulatură medicală
-- Erori: 50301 = Titulatură negăsită
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.MedicalTitle_ToggleActive
    @Id       UNIQUEIDENTIFIER,
    @IsActive BIT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM MedicalTitles WHERE Id = @Id)
        BEGIN
            ;THROW 50301, N'Titulatura medicală nu a fost găsită.', 1;
        END;

        UPDATE MedicalTitles
        SET IsActive  = @IsActive,
            UpdatedAt = GETDATE()
        WHERE Id = @Id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
