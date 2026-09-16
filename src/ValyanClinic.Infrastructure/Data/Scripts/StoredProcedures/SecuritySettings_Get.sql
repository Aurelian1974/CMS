-- =============================================================================
-- SP: SecuritySettings_Get — setarile globale de securitate (randul unic).
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.SecuritySettings_Get
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SELECT TOP 1
           s.PasswordMinLength,
           s.PasswordMaxLength,
           s.PasswordMinDigits,
           s.PasswordMinSpecial,
           s.PasswordMinUppercase,
           s.PasswordMinLowercase,
           s.PasswordBlocklistEnabled,
           s.PasswordForbidIdentityValues,
           s.PasswordHistoryCount,
           s.PasswordExpiryDays,
           s.MaxFailedLoginAttempts,
           s.LockoutMinutes,
           s.SecurityEventRetentionDays,
           s.RefreshTokenRetentionDays,
           s.UpdatedAt,
           s.UpdatedBy
    FROM dbo.SecuritySettings s
    WHERE s.Id = 1;
END;
GO
