namespace ValyanClinic.Domain.ValueObjects;

/// <summary>
/// Cod Numeric Personal (CNP) românesc — 13 cifre cu validare completă:
/// format, cifră de control (Luhn-like), și primul digit valid (1-9).
/// </summary>
public sealed class Cnp
{
    // Vectorul de ponderi pentru calculul cifrei de control (poziția 13)
    private static readonly int[] ControlWeights = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9];

    public string Value { get; }

    private Cnp(string value) => Value = value;

    /// <summary>Returnează <c>true</c> dacă șirul reprezintă un CNP valid.</summary>
    public static bool IsValid(string? cnp) => TryCreate(cnp, out _);

    /// <summary>
    /// Încearcă să construiască un <see cref="Cnp"/> valid.
    /// Returnează <c>false</c> dacă formatul sau cifra de control sunt incorecte.
    /// </summary>
    public static bool TryCreate(string? cnp, out Cnp? result)
    {
        result = null;

        if (string.IsNullOrWhiteSpace(cnp) || cnp.Length != 13)
            return false;

        foreach (var c in cnp)
            if (!char.IsAsciiDigit(c)) return false;

        // Primul digit: 1-9 (0 este invalid ca sex/secol)
        if (cnp[0] == '0')
            return false;

        // Cifra de control: suma ponderată mod 11, restul 10 → cifra 1
        var sum = 0;
        for (var i = 0; i < 12; i++)
            sum += (cnp[i] - '0') * ControlWeights[i];

        var remainder = sum % 11;
        var expected = remainder == 10 ? 1 : remainder;

        if (cnp[12] - '0' != expected)
            return false;

        result = new Cnp(cnp);
        return true;
    }

    public override string ToString() => Value;
    public override bool Equals(object? obj) => obj is Cnp other && Value == other.Value;
    public override int GetHashCode() => Value.GetHashCode();
}
