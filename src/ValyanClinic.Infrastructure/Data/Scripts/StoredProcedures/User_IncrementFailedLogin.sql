-- =============================================================================
-- SP: User_IncrementFailedLogin — incrementare login eșuat + lockout dacă depășit
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
    SET FailedLoginAttempts = FailedLoginAttempts + 1,
        LockoutEnd = CASE
            WHEN FailedLoginAttempts + 1 >= @MaxAttempts
            THEN DATEADD(MINUTE, @LockoutMinutes, GETDATE())
            ELSE LockoutEnd
        END
    WHERE Id = @Id AND IsDeleted = 0;
END;
GO
