using ValyanClinic.Application.Common.Interfaces;

namespace ValyanClinic.Application.Common.Validation;

/// <summary>
/// Verifica o parola fata de politica activa, citita din setari.
///
/// Returneaza lista de incalcari in loc de un simplu adevarat/fals: utilizatorul
/// trebuie sa afle exact ce lipseste, nu doar ca parola e respinsa. O politica
/// stricta fara mesaje precise produce incercari repetate la intamplare.
/// </summary>
public interface IPasswordPolicyChecker
{
    /// <param name="identityValues">
    /// Valori care nu au voie sa apara ca parola — email, username, nume. O parola
    /// egala cu identitatea publica a contului e ghicita din prima.
    /// </param>
    Task<IReadOnlyList<string>> ValidateAsync(
        string? password,
        IEnumerable<string?>? identityValues = null,
        CancellationToken ct = default);
}

/// <inheritdoc />
public sealed class PasswordPolicyChecker(ISecuritySettingsProvider settingsProvider)
    : IPasswordPolicyChecker
{
    public async Task<IReadOnlyList<string>> ValidateAsync(
        string? password,
        IEnumerable<string?>? identityValues = null,
        CancellationToken ct = default)
    {
        var errors = new List<string>();

        if (string.IsNullOrEmpty(password))
        {
            errors.Add("Parola este obligatorie.");
            return errors;
        }

        // Provider-ul garanteaza pragurile minime, deci valorile pot fi folosite direct.
        var settings = await settingsProvider.GetAsync(ct);

        if (password.Length < settings.PasswordMinLength)
            errors.Add($"Parola trebuie să aibă minimum {settings.PasswordMinLength} caractere.");

        if (password.Length > settings.PasswordMaxLength)
            errors.Add($"Parola nu poate depăși {settings.PasswordMaxLength} de caractere.");

        if (string.IsNullOrWhiteSpace(password))
        {
            errors.Add("Parola nu poate conține doar spații.");
            return errors;
        }

        AddIfBelow(errors, password.Count(char.IsDigit), settings.PasswordMinDigits,
            "cifră", "cifre");

        AddIfBelow(errors, password.Count(PasswordRules.IsSpecial), settings.PasswordMinSpecial,
            "caracter special", "caractere speciale");

        AddIfBelow(errors, password.Count(char.IsUpper), settings.PasswordMinUppercase,
            "literă mare", "litere mari");

        AddIfBelow(errors, password.Count(char.IsLower), settings.PasswordMinLowercase,
            "literă mică", "litere mici");

        if (settings.PasswordBlocklistEnabled && PasswordRules.BlockedPasswords.Contains(password))
            errors.Add("Parola aleasă este prea des folosită. Alegeți alta.");

        if (settings.PasswordForbidIdentityValues
            && identityValues is not null
            && MatchesIdentity(password, identityValues))
            errors.Add("Parola nu poate fi identică cu emailul, username-ul sau numele contului.");

        return errors;
    }

    /// <summary>
    /// Mesajul spune si cate sunt necesare, si cate au fost gasite: altfel utilizatorul
    /// nu stie cat ii lipseste.
    /// </summary>
    private static void AddIfBelow(
        List<string> errors, int actual, int required, string singular, string plural)
    {
        if (required <= 0 || actual >= required) return;

        var noun = required == 1 ? singular : plural;
        errors.Add($"Parola trebuie să conțină cel puțin {required} {noun} (are {actual}).");
    }

    private static bool MatchesIdentity(string password, IEnumerable<string?> values)
        => values.Any(value =>
            !string.IsNullOrWhiteSpace(value)
            && string.Equals(value.Trim(), password, StringComparison.OrdinalIgnoreCase));
}
