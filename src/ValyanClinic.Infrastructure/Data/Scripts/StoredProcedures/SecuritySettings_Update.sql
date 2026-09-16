-- =============================================================================
-- SP: SecuritySettings_Update — salveaza setarile globale.
--
-- Pragurile minime sunt impuse si aici, nu doar in C#: un rand modificat direct
-- in baza de date nu trebuie sa poata slabi politica sub nivelul de siguranta.
-- =============================================================================
SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROCEDURE dbo.SecuritySettings_Update
    @PasswordMinLength            INT,
    @PasswordMaxLength            INT,
    @PasswordMinDigits            INT,
    @PasswordMinSpecial           INT,
    @PasswordMinUppercase         INT,
    @PasswordMinLowercase         INT,
    @PasswordForbidIdentityValues BIT,
    @PasswordHistoryCount         INT,
    @PasswordExpiryDays           INT,
    @MaxFailedLoginAttempts       INT,
    @LockoutMinutes               INT,
    @SecurityEventRetentionDays   INT,
    @RefreshTokenRetentionDays    INT,
    @UpdatedBy                    UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    UPDATE dbo.SecuritySettings
    SET PasswordMinLength            = CASE WHEN @PasswordMinLength < 8 THEN 8 ELSE @PasswordMinLength END,
        PasswordMaxLength            = @PasswordMaxLength,
        PasswordMinDigits            = CASE WHEN @PasswordMinDigits    < 0 THEN 0 ELSE @PasswordMinDigits END,
        PasswordMinSpecial           = CASE WHEN @PasswordMinSpecial   < 0 THEN 0 ELSE @PasswordMinSpecial END,
        PasswordMinUppercase         = CASE WHEN @PasswordMinUppercase < 0 THEN 0 ELSE @PasswordMinUppercase END,
        PasswordMinLowercase         = CASE WHEN @PasswordMinLowercase < 0 THEN 0 ELSE @PasswordMinLowercase END,
        -- PasswordBlocklistEnabled nu e parametru: lista de blocare ramane mereu activa.
        PasswordBlocklistEnabled     = 1,
        PasswordForbidIdentityValues = @PasswordForbidIdentityValues,
        PasswordHistoryCount         = CASE WHEN @PasswordHistoryCount < 0 THEN 0 ELSE @PasswordHistoryCount END,
        PasswordExpiryDays           = CASE WHEN @PasswordExpiryDays   < 0 THEN 0 ELSE @PasswordExpiryDays END,
        MaxFailedLoginAttempts       = CASE WHEN @MaxFailedLoginAttempts < 3 THEN 3 ELSE @MaxFailedLoginAttempts END,
        LockoutMinutes               = CASE WHEN @LockoutMinutes < 1 THEN 1 ELSE @LockoutMinutes END,
        SecurityEventRetentionDays   = CASE WHEN @SecurityEventRetentionDays < 90 THEN 90 ELSE @SecurityEventRetentionDays END,
        RefreshTokenRetentionDays    = CASE WHEN @RefreshTokenRetentionDays  < 1 THEN 1 ELSE @RefreshTokenRetentionDays END,
        UpdatedAt                    = SYSUTCDATETIME(),
        UpdatedBy                    = @UpdatedBy
    WHERE Id = 1;
END;
GO
