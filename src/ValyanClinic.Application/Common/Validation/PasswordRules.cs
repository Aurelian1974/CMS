using FluentValidation;

namespace ValyanClinic.Application.Common.Validation;

/// <summary>
/// Politica de parole, partajată între schimbarea proprie și resetul administrativ,
/// ca cele două fluxuri să nu poată diverge.
///
/// Urmează NIST SP 800-63B: lungime în locul regulilor de compoziție, plus o listă
/// de blocare. Regulile de complexitate („o majusculă, o cifră, un simbol") împing
/// utilizatorii spre tipare previzibile de tipul Parola1! și nu adaugă entropie reală.
/// </summary>
public static class PasswordRules
{
    /// <summary>Lungimea minimă acceptată. Peste minimul de 8 recomandat de OWASP.</summary>
    public const int MinimumLength = 12;

    /// <summary>
    /// Limita superioară previne un DoS prin BCrypt: hashing-ul e intenționat lent,
    /// iar BCrypt oricum ignoră tot ce depășește 72 de bytes.
    /// </summary>
    public const int MaximumLength = 100;

    /// <summary>
    /// Parole frecvente și tipare locale evidente. Nu e o listă exhaustivă — scopul e
    /// să blocheze alegerile cele mai probabile dintr-un atac de tip credential stuffing,
    /// nu să înlocuiască un serviciu dedicat de verificare a parolelor compromise.
    /// </summary>
    private static readonly HashSet<string> BlockedPasswords = new(StringComparer.OrdinalIgnoreCase)
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
    /// Aplică politica pe câmpul de parolă nouă. <paramref name="identityValues"/> sunt
    /// valorile care nu au voie să apară ca parolă (email, username, nume) — o parolă
    /// egală cu identitatea publică a contului e ghicită din prima.
    /// </summary>
    public static IRuleBuilderOptions<T, string> ApplyPasswordPolicy<T>(
        this IRuleBuilder<T, string> rule,
        Func<T, IEnumerable<string?>>? identityValues = null)
    {
        return rule
            .NotEmpty().WithMessage("Parola nouă este obligatorie.")
            .MinimumLength(MinimumLength)
                .WithMessage($"Parola trebuie să aibă minimum {MinimumLength} caractere.")
            .MaximumLength(MaximumLength)
                .WithMessage($"Parola nu poate depăși {MaximumLength} de caractere.")
            .Must(password => !IsBlocked(password))
                .WithMessage("Parola aleasă este prea des folosită. Alegeți alta.")
            .Must(password => !IsWhitespaceOnly(password))
                .WithMessage("Parola nu poate conține doar spații.")
            .Must((instance, password) =>
                    identityValues is null || !MatchesIdentity(password, identityValues(instance)))
                .WithMessage("Parola nu poate fi identică cu emailul, username-ul sau numele contului.");
    }

    private static bool IsBlocked(string? password)
        => password is not null && BlockedPasswords.Contains(password);

    private static bool IsWhitespaceOnly(string? password)
        => !string.IsNullOrEmpty(password) && string.IsNullOrWhiteSpace(password);

    private static bool MatchesIdentity(string? password, IEnumerable<string?> values)
    {
        if (string.IsNullOrWhiteSpace(password))
            return false;

        return values.Any(value =>
            !string.IsNullOrWhiteSpace(value)
            && string.Equals(value.Trim(), password, StringComparison.OrdinalIgnoreCase));
    }
}
