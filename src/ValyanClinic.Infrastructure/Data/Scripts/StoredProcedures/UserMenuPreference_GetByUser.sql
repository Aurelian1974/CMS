SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

-- ============================================================================
-- SP: UserMenuPreference_GetByUser
-- Descriere: Returneaza favoritele sidebar-ului pentru utilizatorul curent.
--   0 randuri = utilizatorul nu si-a salvat inca niciun favorit.
-- ============================================================================
CREATE OR ALTER PROCEDURE dbo.UserMenuPreference_GetByUser
    @UserId   UNIQUEIDENTIFIER,
    @ClinicId UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;

    SELECT FavoriteRoutes
    FROM dbo.UserMenuPreferences
    WHERE UserId = @UserId
      AND ClinicId = @ClinicId;
END;
GO
