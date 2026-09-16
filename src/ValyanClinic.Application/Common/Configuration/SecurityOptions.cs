namespace ValyanClinic.Application.Common.Configuration;

/// <summary>
/// Opțiuni pentru securitatea conturilor — hashing parole și blocare la login eșuat.
/// Definit în Application layer pentru acces din handlers.
/// </summary>
public sealed class SecurityOptions
{
    public const string SectionName = "Security";

    /// <summary>Work factor BCrypt — recomandat minim 12 în producție.</summary>
    public int BcryptWorkFactor { get; init; } = 12;

    /// <summary>Numărul de încercări eșuate consecutive după care contul se blochează.</summary>
    public int MaxFailedLoginAttempts { get; init; } = 5;

    /// <summary>
    /// Durata blocării contului, în minute. Distinctă de fereastra rate-limiter-ului
    /// (<see cref="RateLimitingOptions.LoginWindowMinutes"/>): aceea limitează cererile
    /// per IP, aceasta blochează un cont anume. Anterior erau aceeași valoare, ceea ce
    /// făcea imposibilă reglarea lor independentă.
    /// </summary>
    public int LockoutMinutes { get; init; } = 15;
}
