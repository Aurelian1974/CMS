-- ============================================================================
-- SP: MedicalTitle_Create
-- Descriere: Creează o titulatură medicală nouă
-- Erori: 50300 = Cod duplicat
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.MedicalTitle_Create
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

        -- Verifică cod duplicat
        IF EXISTS (SELECT 1 FROM MedicalTitles WHERE Code = @Code)
        BEGIN
            ;THROW 50300, N'Există deja o titulatură cu acest cod.', 1;
        END;

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO MedicalTitles (Name, Code, Description, DisplayOrder, IsActive, CreatedAt)
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (@Name, @Code, @Description, @DisplayOrder, 1, GETDATE());

        COMMIT TRANSACTION;
        SELECT Id FROM @OutputIds;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
