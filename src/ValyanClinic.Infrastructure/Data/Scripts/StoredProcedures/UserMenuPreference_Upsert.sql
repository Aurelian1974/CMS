SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: UserMenuPreference_Upsert
-- Descriere: Salveaza favoritele sidebar-ului pentru utilizatorul curent.
--   Ordinea din array-ul JSON e ordinea de afisare — reordonarea e doar o
--   noua valoare pentru @FavoriteRoutes.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.UserMenuPreference_Upsert
    @UserId         UNIQUEIDENTIFIER,
    @ClinicId       UNIQUEIDENTIFIER,
    @FavoriteRoutes NVARCHAR(MAX),
    @UpdatedBy      UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF EXISTS (SELECT 1 FROM dbo.UserMenuPreferences WHERE UserId = @UserId AND ClinicId = @ClinicId)
        BEGIN
            UPDATE dbo.UserMenuPreferences
            SET FavoriteRoutes = @FavoriteRoutes,
                UpdatedAt      = SYSDATETIME(),
                UpdatedBy      = @UpdatedBy
            WHERE UserId = @UserId
              AND ClinicId = @ClinicId;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.UserMenuPreferences
                (UserId, ClinicId, FavoriteRoutes, UpdatedBy)
            VALUES
                (@UserId, @ClinicId, @FavoriteRoutes, @UpdatedBy);
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH;
END;
GO
