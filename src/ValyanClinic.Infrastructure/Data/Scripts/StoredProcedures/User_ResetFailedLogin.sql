-- =============================================================================
-- SP: User_ResetFailedLogin — resetare contor login eșuat + lockout (la login reușit)
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO
CREATE OR ALTER PROCEDURE dbo.User_ResetFailedLogin
    @Id UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    UPDATE Users
    SET FailedLoginAttempts = 0,
        LockoutEnd         = NULL,
        LastLoginAt        = GETDATE()
    WHERE Id = @Id AND IsDeleted = 0;
END;
GO
