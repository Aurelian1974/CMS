using ValyanClinic.Application.Features.SecuritySettings.DTOs;

namespace ValyanClinic.Application.Common.Constants;

/// <summary>
/// Pragurile pe care administratorul nu le poate cobori.
///
/// Sunt impuse in trei locuri, intentionat redundant: in formular (feedback imediat),
/// in stored procedure (un rand modificat direct in baza de date) si aici, la citire.
/// Ultimul strat conteaza cel mai mult — garanteaza ca aplicatia nu aplica niciodata o
/// politica mai slaba decat minimul, indiferent cum a ajuns valoarea in tabela.
/// </summary>
public static class SecuritySettingsLimits
{
    /// <summary>Sub 8 caractere politica ar fi mai slaba decat recomandarea OWASP.</summary>
    public const int MinPasswordLength = 8;
    public const int MaxPasswordLength = 256;

    /// <summary>Sub trei incercari, o greseala de tastare ar bloca contul.</summary>
    public const int MinFailedLoginAttempts = 3;
    public const int MinLockoutMinutes = 1;

    /// <summary>Sub 90 de zile jurnalul nu ar acoperi o investigatie tarzie.</summary>
    public const int MinSecurityEventRetentionDays = 90;
    public const int MinRefreshTokenRetentionDays = 1;

    public const int MinIdleTimeoutMinutes = 1;
    public const int MaxIdleTimeoutMinutes = 1440;
    public const int MinRefreshTokenDays = 1;
    public const int MaxRefreshTokenDays = 365;

    /// <summary>Aduce setarile in intervalele permise, fara sa arunce.</summary>
    public static SecuritySettingsDto Sanitize(SecuritySettingsDto s) => s with
    {
        PasswordMinLength    = Clamp(s.PasswordMinLength, MinPasswordLength, MaxPasswordLength),
        PasswordMaxLength    = Clamp(s.PasswordMaxLength, MinPasswordLength, MaxPasswordLength),
        PasswordMinDigits    = AtLeast(s.PasswordMinDigits, 0),
        PasswordMinSpecial   = AtLeast(s.PasswordMinSpecial, 0),
        PasswordMinUppercase = AtLeast(s.PasswordMinUppercase, 0),
        PasswordMinLowercase = AtLeast(s.PasswordMinLowercase, 0),
        PasswordBlocklistEnabled   = true,
        PasswordHistoryCount = AtLeast(s.PasswordHistoryCount, 0),
        PasswordExpiryDays   = AtLeast(s.PasswordExpiryDays, 0),
        MaxFailedLoginAttempts     = AtLeast(s.MaxFailedLoginAttempts, MinFailedLoginAttempts),
        LockoutMinutes             = AtLeast(s.LockoutMinutes, MinLockoutMinutes),
        SecurityEventRetentionDays = AtLeast(s.SecurityEventRetentionDays, MinSecurityEventRetentionDays),
        RefreshTokenRetentionDays  = AtLeast(s.RefreshTokenRetentionDays, MinRefreshTokenRetentionDays),
    };

    /// <summary>Aduce setarile de rol in intervalele permise.</summary>
    public static RoleSecuritySettingsDto Sanitize(RoleSecuritySettingsDto s) => s with
    {
        IdleTimeoutMinutes = Clamp(s.IdleTimeoutMinutes, MinIdleTimeoutMinutes, MaxIdleTimeoutMinutes),
        RefreshTokenDays   = Clamp(s.RefreshTokenDays,   MinRefreshTokenDays,   MaxRefreshTokenDays),
    };

    private static int AtLeast(int value, int minimum) => value < minimum ? minimum : value;

    private static int Clamp(int value, int minimum, int maximum)
        => value < minimum ? minimum : value > maximum ? maximum : value;
}
