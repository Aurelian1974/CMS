using System.Text.RegularExpressions;

namespace ValyanClinic.Domain.ValueObjects;

/// <summary>
/// Număr de telefon românesc validat.
/// Acceptă format național (07xx, 02x, 03x) și internațional (+40, 0040).
/// Caracterele de formatare (spații, liniuțe, puncte) sunt ignorate la validare.
/// </summary>
public sealed partial class PhoneNumber
{
    // Acceptă:
    //   07xxxxxxxx  — mobil (Vodafone, Orange, Telekom, Digi)
    //   02xxxxxxxx  — fix (Muntenia/Sud)
    //   03xxxxxxxx  — fix (Moldova/Nord)
    //   +40 | 0040 ca prefix internațional
    [GeneratedRegex(@"^(\+40|0040|0)[23][0-9]{8}$|^(\+40|0040|0)7[0-9]{8}$",
        RegexOptions.Compiled)]
    private static partial Regex PhonePattern();

    public string Value { get; }

    private PhoneNumber(string value) => Value = value;

    /// <summary>Returnează <c>true</c> dacă șirul reprezintă un număr de telefon românesc valid.</summary>
    public static bool IsValid(string? phone) => TryCreate(phone, out _);

    /// <summary>
    /// Încearcă să construiască un <see cref="PhoneNumber"/> valid,
    /// eliminând caracterele de formatare (spații, liniuțe, puncte).
    /// </summary>
    public static bool TryCreate(string? phone, out PhoneNumber? result)
    {
        result = null;

        if (string.IsNullOrWhiteSpace(phone))
            return false;

        // Elimină formatare: spații, liniuțe, puncte, paranteze
        var normalized = phone
            .Replace(" ", "")
            .Replace("-", "")
            .Replace(".", "")
            .Replace("(", "")
            .Replace(")", "");

        if (!PhonePattern().IsMatch(normalized))
            return false;

        result = new PhoneNumber(normalized);
        return true;
    }

    public override string ToString() => Value;
    public override bool Equals(object? obj) => obj is PhoneNumber other && Value == other.Value;
    public override int GetHashCode() => Value.GetHashCode();
}
