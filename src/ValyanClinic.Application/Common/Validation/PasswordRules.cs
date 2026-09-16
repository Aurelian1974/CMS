namespace ValyanClinic.Application.Common.Validation;

/// <summary>
/// Datele fixe ale politicii de parole: lista de blocare si setul de caractere
/// considerate speciale.
///
/// Pragurile numerice NU mai sunt aici — au trecut in tabela SecuritySettings si se
/// citesc prin ISecuritySettingsProvider. In acest fisier ramane doar ce nu are sens
/// sa fie configurabil: lista de parole frecvente si definitia unui caracter special.
/// </summary>
public static class PasswordRules
{
    /// <summary>
    /// Parole frecvente si tipare locale evidente. Nu e o lista exhaustiva — scopul e
    /// sa blocheze alegerile cele mai probabile dintr-un atac de tip credential stuffing,
    /// nu sa inlocuiasca un serviciu dedicat de verificare a parolelor compromise.
    /// </summary>
    public static readonly IReadOnlySet<string> BlockedPasswords =
        new HashSet<string>(StringComparer.OrdinalIgnoreCase)
        {
            "123456", "123456789", "12345678", "1234567890", "12345", "1234567",
            "password", "password1", "password123", "parola", "parola123", "parolamea",
            "qwerty", "qwerty123", "qwertyuiop", "asdfghjkl", "zxcvbnm",
            "abc123", "abcd1234", "111111", "000000", "1qaz2wsx", "qazwsx",
            "iloveyou", "admin", "admin123", "administrator", "root", "toor",
            "welcome", "welcome1", "letmein", "monkey", "dragon", "sunshine",
            "princess", "football", "baseball", "superman", "trustno1", "master",
            "login", "passw0rd", "p@ssw0rd", "p@ssword", "secret", "changeme",
            "clinica", "clinica123", "valyan", "valyanclinic", "spital", "medical",
            "doctor", "doctor123", "asistenta", "receptie", "bucuresti", "romania",
            "test", "test123", "testtest", "user", "user123", "guest",
        };

    /// <summary>
    /// Un caracter e special daca nu e litera si nu e cifra. Definitia prin excludere
    /// evita o lista fixa de simboluri care ar respinge caractere perfect valide
    /// dintr-un layout de tastatura diferit.
    /// </summary>
    public static bool IsSpecial(char c) => !char.IsLetterOrDigit(c);
}
