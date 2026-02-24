SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

CREATE OR ALTER PROCEDURE dbo.Department_Create
    @ClinicId    UNIQUEIDENTIFIER,
    @LocationId  UNIQUEIDENTIFIER,
    @Name        NVARCHAR(200),
    @Code        NVARCHAR(20),
    @Description NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Validare: locația trebuie să existe și să aparțină aceleiași clinici
        IF NOT EXISTS (SELECT 1 FROM ClinicLocations WHERE Id = @LocationId AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50222, 'Locația selectată nu există sau nu aparține acestei clinici.', 1;
        END;

        -- Validare: codul trebuie să fie unic per clinică (inclusiv departamente active)
        IF EXISTS (SELECT 1 FROM Departments WHERE Code = @Code AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50221, 'Un departament cu acest cod există deja.', 1;
        END;

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO Departments (ClinicId, LocationId, Name, Code, Description,
                                 IsActive, IsDeleted, CreatedAt)
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (@ClinicId, @LocationId, @Name, @Code, @Description,
                1, 0, GETDATE());

        COMMIT TRANSACTION;
        SELECT Id FROM @OutputIds;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
