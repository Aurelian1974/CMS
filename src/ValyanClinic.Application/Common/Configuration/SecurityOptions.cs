namespace ValyanClinic.Application.Common.Configuration;

/// <summary>
/// Optiuni de securitate care raman in appsettings.json.
///
/// Pragurile de blocare, politica de parole si retentia au trecut in tabela
/// SecuritySettings, administrabila din aplicatie — vezi ISecuritySettingsProvider.
/// Aici ramane doar ce nu are ce cauta intr-un formular: work factor-ul BCrypt
/// schimba costul fiecarei autentificari si trebuie ales la deploy, nu la runtime.
/// </summary>
public sealed class SecurityOptions
{
    public const string SectionName = "Security";

    /// <summary>Work factor BCrypt — recomandat minim 12 în producție.</summary>
    public int BcryptWorkFactor { get; init; } = 12;

}
