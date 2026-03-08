SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicContactPerson_Create
-- Descriere: Adaugă o persoană de contact pentru o clinică
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicContactPerson_Create
    @ClinicId    UNIQUEIDENTIFIER,
    @Name        NVARCHAR(200),
    @Function    NVARCHAR(100) = NULL,
    @PhoneNumber NVARCHAR(50)  = NULL,
    @Email       NVARCHAR(200) = NULL,
    @IsMain      BIT           = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM dbo.Clinics WHERE Id = @ClinicId)
        BEGIN
            ;THROW 50201, N'Clinica nu a fost găsită.', 1;
        END;

        -- Dacă noua persoană e principală, resetează altele principale
        IF @IsMain = 1
        BEGIN
            UPDATE dbo.ClinicContactPersons
            SET IsMain = 0, UpdatedAt = GETDATE()
            WHERE ClinicId = @ClinicId AND IsMain = 1 AND IsDeleted = 0;
        END;

        DECLARE @OutputIds TABLE (Id UNIQUEIDENTIFIER);

        INSERT INTO dbo.ClinicContactPersons (ClinicId, Name, [Function], PhoneNumber, Email, IsMain)
        OUTPUT INSERTED.Id INTO @OutputIds(Id)
        VALUES (@ClinicId, @Name, @Function, @PhoneNumber, @Email, @IsMain);

        COMMIT TRANSACTION;
        SELECT Id FROM @OutputIds;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
