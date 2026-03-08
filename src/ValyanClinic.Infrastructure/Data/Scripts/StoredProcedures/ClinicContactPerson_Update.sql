SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicContactPerson_Update
-- Descriere: Actualizează o persoană de contact a clinicii
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicContactPerson_Update
    @Id          UNIQUEIDENTIFIER,
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

        IF NOT EXISTS (
            SELECT 1 FROM dbo.ClinicContactPersons
            WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50280, N'Persoana de contact nu a fost găsită.', 1;
        END;

        -- Dacă persoana devine principală, resetează celelalte
        IF @IsMain = 1
        BEGIN
            UPDATE dbo.ClinicContactPersons
            SET IsMain = 0, UpdatedAt = GETDATE()
            WHERE ClinicId = @ClinicId AND IsMain = 1 AND IsDeleted = 0 AND Id <> @Id;
        END;

        UPDATE dbo.ClinicContactPersons
        SET Name        = @Name,
            [Function]  = @Function,
            PhoneNumber = @PhoneNumber,
            Email       = @Email,
            IsMain      = @IsMain,
            UpdatedAt   = GETDATE()
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
