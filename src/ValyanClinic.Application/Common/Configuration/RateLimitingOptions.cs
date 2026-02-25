namespace ValyanClinic.Application.Common.Configuration;

/// <summary>
/// Opțiuni pentru rate limiting (login attempts, general requests).
/// Definit în Application layer pentru acces din handlers.
/// </summary>
public sealed class RateLimitingOptions
{
    public const string SectionName = "RateLimiting";

    public int LoginMaxAttempts     { get; init; } = 5;
    public int LoginWindowMinutes   { get; init; } = 15;
    public int GeneralMaxRequests   { get; init; } = 100;
    public int GeneralWindowSeconds { get; init; } = 60;
}
