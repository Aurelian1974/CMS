-- =============================================================================
-- SP: User_UpdatePassword — actualizare parolă (hash-ul BCrypt vine din C#)
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.User_UpdatePassword
    @Id           UNIQUEIDENTIFIER,
    @ClinicId     UNIQUEIDENTIFIER,
    @PasswordHash NVARCHAR(500),
    @UpdatedBy    UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM Users WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50507, N'Utilizatorul nu a fost găsit.', 1;
        END;

        UPDATE Users
        SET PasswordHash = @PasswordHash,
            UpdatedBy    = @UpdatedBy,
            UpdatedAt    = GETDATE()
        WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0;

        COMMIT TRANSACTION;
        SELECT 1 AS Success;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        ;THROW;
    END CATCH;
END;
GO
