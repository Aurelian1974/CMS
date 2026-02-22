namespace ValyanClinic.Infrastructure.Configuration;

/// <summary>
/// Opțiuni pentru securitate (hashing parole).
/// </summary>
public sealed class SecurityOptions
{
    public const string SectionName = "Security";

    /// <summary>Work factor BCrypt — recomandat minim 12 în producție.</summary>
    public int BcryptWorkFactor { get; init; } = 12;
}
