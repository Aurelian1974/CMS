namespace ValyanClinic.Application.Common.Configuration;

/// <summary>
/// Opțiuni pentru configurarea JWT (token-uri de autentificare).
/// Definit în Application layer pentru acces din handlers.
/// </summary>
public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Secret                { get; init; } = string.Empty;
    public string Issuer                { get; init; } = string.Empty;
    public string Audience              { get; init; } = string.Empty;
    public int AccessTokenExpiryMinutes { get; init; } = 15;
    public int RefreshTokenExpiryDays   { get; init; } = 7;
}
