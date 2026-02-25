-- ============================================================================
-- SP: MedicalTitle_Update
-- Descriere: Actualizează o titulatură medicală existentă
-- Erori: 50300 = Cod duplicat, 50301 = Titulatură negăsită
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.MedicalTitle_Update
    @Id           UNIQUEIDENTIFIER,
    @Name         NVARCHAR(100),
    @Code         NVARCHAR(20),
    @Description  NVARCHAR(500) = NULL,
    @DisplayOrder INT = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Verifică existența
        IF NOT EXISTS (SELECT 1 FROM MedicalTitles WHERE Id = @Id)
        BEGIN
            ;THROW 50301, N'Titulatura medicală nu a fost găsită.', 1;
        END;

        -- Verifică cod duplicat (excluzând înregistrarea curentă)
        IF EXISTS (SELECT 1 FROM MedicalTitles WHERE Code = @Code AND Id <> @Id)
        BEGIN
            ;THROW 50300, N'Există deja o titulatură cu acest cod.', 1;
        END;

        UPDATE MedicalTitles
        SET Name         = @Name,
            Code         = @Code,
            Description  = @Description,
            DisplayOrder = @DisplayOrder,
            UpdatedAt    = GETDATE()
        WHERE Id = @Id;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
