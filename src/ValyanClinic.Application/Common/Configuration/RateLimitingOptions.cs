namespace ValyanClinic.Application.Common.Configuration;

/// <summary>
/// Opțiuni pentru rate limiting (login attempts, general requests).
/// Definit în Application layer pentru acces din handlers.
/// </summary>
public sealed class RateLimitingOptions
{
    public const string SectionName = "RateLimiting";

    /// <summary>
    /// Incercari de login permise per adresa IP intr-o fereastra. Este o limita
    /// anti-flood la nivel de infrastructura, nu protectia impotriva fortei brute
    /// pe un cont anume — aceea e blocarea per cont din Security:MaxFailedLoginAttempts.
    ///
    /// Valoarea e mai generoasa decat pragul de blocare tocmai pentru ca o clinica
    /// intreaga poate iesi la internet printr-un singur IP: cu o limita egala cu
    /// pragul per cont, prima persoana care greseste parola blocheaza login-ul
    /// pentru toti colegii.
    /// </summary>
    public int LoginMaxAttempts     { get; init; } = 30;
    public int LoginWindowMinutes   { get; init; } = 15;

    /// <summary>
    /// Limita pentru /refresh, separata de cea de login. Rotatia token-ului e o
    /// operatie legitima si frecventa: fiecare tab deschis o declanseaza la 15
    /// minute, deci limita de login ar fi epuizata de utilizare normala.
    /// </summary>
    public int RefreshMaxRequests   { get; init; } = 60;
    public int RefreshWindowMinutes { get; init; } = 15;

    /// <summary>
    /// Limita pentru schimbarea propriei parole. Endpoint-ul verifica parola curenta,
    /// deci e o suprafata de ghicire chiar si pentru cineva care are deja un token
    /// valid. Nu exista blocare de cont aici, deci limita e singura franare peste
    /// costul BCrypt.
    /// </summary>
    public int PasswordChangeMaxRequests   { get; init; } = 10;
    public int PasswordChangeWindowMinutes { get; init; } = 15;

    public int GeneralMaxRequests   { get; init; } = 100;
    public int GeneralWindowSeconds { get; init; } = 60;
}
