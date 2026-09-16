-- =============================================================================
-- SP: User_IncrementFailedLogin — incrementare login eșuat + lockout dacă depășit
--
-- Contorul repornește de la 1 dacă blocarea anterioară a expirat deja. Fără asta,
-- FailedLoginAttempts rămânea la valoarea de prag după deblocare (se reseta doar la
-- login reușit, prin User_ResetFailedLogin), iar o singură greșeală de tastare
-- reblocha contul instantaneu, la nesfârșit.
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.User_IncrementFailedLogin
    @Id              UNIQUEIDENTIFIER,
    @MaxAttempts     INT = 5,
    @LockoutMinutes  INT = 15
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    UPDATE Users
    SET FailedLoginAttempts = CASE
            -- Fereastra de blocare a expirat → pornim o serie nouă de la această încercare
            WHEN LockoutEnd IS NOT NULL AND LockoutEnd <= GETDATE() THEN 1
            ELSE FailedLoginAttempts + 1
        END,
        LockoutEnd = CASE
            WHEN (CASE
                    WHEN LockoutEnd IS NOT NULL AND LockoutEnd <= GETDATE() THEN 1
                    ELSE FailedLoginAttempts + 1
                  END) >= @MaxAttempts
            THEN DATEADD(MINUTE, @LockoutMinutes, GETDATE())
            -- Blocare expirată și prag neatins → curățăm blocarea veche
            WHEN LockoutEnd IS NOT NULL AND LockoutEnd <= GETDATE() THEN NULL
            ELSE LockoutEnd
        END
    WHERE Id = @Id AND IsDeleted = 0;
END;
GO
