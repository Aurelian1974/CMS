-- ============================================================================
-- SP: Specialty_Create — Creează o specializare nouă
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.Specialty_Create
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

        -- Validare cod unic
        IF EXISTS (SELECT 1 FROM Specialties WHERE Code = @Code)
        BEGIN
            ;THROW 50100, N'O specializare cu acest cod există deja.', 1;
        END;

        -- Validare ParentId valid (dacă e specificat)
        IF @ParentId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Specialties WHERE Id = @ParentId)
        BEGIN
            ;THROW 50101, N'Categoria/specializarea părinte nu a fost găsită.', 1;
        END;

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO Specialties (ParentId, Name, Code, Description, DisplayOrder, Level, IsActive, CreatedAt)
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (@ParentId, @Name, @Code, @Description, @DisplayOrder, @Level, 1, GETDATE());

        COMMIT TRANSACTION;
        SELECT Id FROM @OutputIds;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
