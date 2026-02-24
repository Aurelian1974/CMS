-- ============================================================================
-- SP: Specialty_Update — Actualizează o specializare existentă
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Specialty_Update
    @Id           UNIQUEIDENTIFIER,
    @ParentId     UNIQUEIDENTIFIER = NULL,
    @Name         NVARCHAR(150),
    @Code         NVARCHAR(20),
    @Description  NVARCHAR(500) = NULL,
    @DisplayOrder INT = 0,
    @Level        TINYINT = 1
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validare existență
        IF NOT EXISTS (SELECT 1 FROM Specialties WHERE Id = @Id)
        BEGIN
            ;THROW 50102, N'Specializarea nu a fost găsită.', 1;
        END;

        -- Validare cod unic (exclus pe sine)
        IF EXISTS (SELECT 1 FROM Specialties WHERE Code = @Code AND Id <> @Id)
        BEGIN
            ;THROW 50100, N'O specializare cu acest cod există deja.', 1;
        END;

        -- Nu se poate pune ca părinte pe sine sau pe un descendent al său
        IF @ParentId = @Id
        BEGIN
            ;THROW 50103, N'O specializare nu poate fi părinte pentru ea însăși.', 1;
        END;

        UPDATE Specialties
        SET ParentId     = @ParentId,
            Name         = @Name,
            Code         = @Code,
            Description  = @Description,
            DisplayOrder = @DisplayOrder,
            Level        = @Level,
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
