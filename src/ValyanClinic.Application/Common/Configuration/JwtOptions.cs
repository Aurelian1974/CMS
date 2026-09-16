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
    /// <summary>
    /// Durata access token-ului. Ramane in appsettings.json: nu e o setare de
    /// business, ci granularitatea cu care serverul poate observa inactivitatea
    /// (vezi PLAN_SETARI_SECURITATE.md, Etapa 3).
    /// </summary>
    public int AccessTokenExpiryMinutes { get; init; } = 15;
}
