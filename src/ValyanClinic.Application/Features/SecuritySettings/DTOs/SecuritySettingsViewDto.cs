namespace ValyanClinic.Application.Features.SecuritySettings.DTOs;

/// <summary>
/// Tot ce afiseaza ecranul de administrare: setarile globale, setarile de sesiune
/// pe rol si limitele pe care administratorul nu le poate cobori.
///
/// Limitele se trimit la client ca formularul sa poata da feedback imediat, cu
/// aceleasi valori pe care le impune serverul — altfel ar fi doua adevaruri.
/// </summary>
public sealed record SecuritySettingsViewDto
{
    public required SecuritySettingsDto Global { get; init; }
    public required IReadOnlyList<RoleSecuritySettingsDto> Roles { get; init; }
    public required SecuritySettingsLimitsDto Limits { get; init; }
}

/// <summary>Pragurile minime si maxime impuse in cod.</summary>
public sealed record SecuritySettingsLimitsDto
{
    public int MinPasswordLength { get; init; }
    public int MaxPasswordLength { get; init; }
    public int MinFailedLoginAttempts { get; init; }
    public int MinLockoutMinutes { get; init; }
    public int MinSecurityEventRetentionDays { get; init; }
    public int MinRefreshTokenRetentionDays { get; init; }
    public int MinIdleTimeoutMinutes { get; init; }
    public int MaxIdleTimeoutMinutes { get; init; }
    public int MinRefreshTokenDays { get; init; }
    public int MaxRefreshTokenDays { get; init; }
}
