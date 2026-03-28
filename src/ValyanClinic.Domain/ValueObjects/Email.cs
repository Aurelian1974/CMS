using System.Net.Mail;

namespace ValyanClinic.Domain.ValueObjects;

/// <summary>
/// Adresă de email validată conform RFC 5321.
/// Normalizată la lowercase cu trim aplicat.
/// </summary>
public sealed class Email
{
    public string Value { get; }

    private Email(string value) => Value = value;

    /// <summary>Returnează <c>true</c> dacă șirul reprezintă o adresă de email validă.</summary>
    public static bool IsValid(string? email) => TryCreate(email, out _);

    /// <summary>
    /// Încearcă să construiască un <see cref="Email"/> valid,
    /// normalizat (trimmed, lowercase).
    /// </summary>
    public static bool TryCreate(string? email, out Email? result)
    {
        result = null;

        if (string.IsNullOrWhiteSpace(email))
            return false;

        var trimmed = email.Trim();

        // RFC 5321: max 254 caractere
        if (trimmed.Length > 254)
            return false;

        try
        {
            var addr = new MailAddress(trimmed);
            // MailAddress normalizează, verificăm că adresa nu s-a schimbat
            if (!string.Equals(addr.Address, trimmed, StringComparison.OrdinalIgnoreCase))
                return false;

            result = new Email(trimmed.ToLowerInvariant());
            return true;
        }
        catch (FormatException)
        {
            return false;
        }
    }

    public override string ToString() => Value;
    public override bool Equals(object? obj) => obj is Email other && Value == other.Value;
    public override int GetHashCode() => Value.GetHashCode(StringComparison.OrdinalIgnoreCase);
}
