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

    /// <summary>
    /// Câte zile păstrăm refresh token-urile expirate sau revocate înainte de ștergere.
    /// Perioada de retenție menține lanțul ReplacedByTokenHash investigabil după un
    /// incident de securitate; fără curățare, tabela ar crește la infinit.
    /// </summary>
    public int RefreshTokenRetentionDays { get; init; } = 30;

    /// <summary>
    /// Cate zile pastram evenimentele din SecurityEvents. Mult mai mult decat la
    /// refresh tokens: jurnalul trebuie sa poata raspunde unei cereri GDPR sau unei
    /// investigatii ulterioare. Implicit doi ani.
    /// </summary>
    public int SecurityEventRetentionDays { get; init; } = 730;
}
