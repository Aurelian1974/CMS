namespace ValyanClinic.Infrastructure.Configuration;

/// <summary>
/// Opțiuni pentru configurarea CORS.
/// </summary>
public sealed class CorsOptions
{
    public const string SectionName = "Cors";

    public string[] AllowedOrigins { get; init; } = [];
}
