SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: ClinicLocation_Update
-- Descriere: Actualizare locație
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.ClinicLocation_Update
    @Id          UNIQUEIDENTIFIER,
    @ClinicId    UNIQUEIDENTIFIER,
    @Name        NVARCHAR(200),
    @Address     NVARCHAR(500),
    @City        NVARCHAR(100),
    @County      NVARCHAR(100),
    @PostalCode  NVARCHAR(10)  = NULL,
    @PhoneNumber NVARCHAR(20)  = NULL,
    @Email       NVARCHAR(200) = NULL,
    @IsPrimary   BIT           = 0
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (SELECT 1 FROM ClinicLocations WHERE Id = @Id AND ClinicId = @ClinicId AND IsDeleted = 0)
        BEGIN
            ;THROW 50210, N'Locația nu a fost găsită.', 1;
        END;

        -- Dacă locația devine primară, resetează celelalte
        IF @IsPrimary = 1
        BEGIN
            UPDATE ClinicLocations
            SET IsPrimary = 0, UpdatedAt = GETDATE()
            WHERE ClinicId = @ClinicId AND IsPrimary = 1 AND Id <> @Id AND IsDeleted = 0;
        END;

        UPDATE ClinicLocations
        SET Name        = @Name,
            Address     = @Address,
            City        = @City,
            County      = @County,
            PostalCode  = @PostalCode,
            PhoneNumber = @PhoneNumber,
            Email       = @Email,
            IsPrimary   = @IsPrimary,
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
