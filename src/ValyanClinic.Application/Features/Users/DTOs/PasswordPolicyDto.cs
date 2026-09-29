namespace ValyanClinic.Application.Features.Users.DTOs;

/// <summary>
/// Politica de parole activă, expusă clientului pentru feedback imediat în formulare.
/// Serverul o reaplică la salvare, deci valorile de aici nu sunt o garanție de validare.
/// </summary>
public sealed class PasswordPolicyDto
{
    public int MinLength { get; init; }
    public int MaxLength { get; init; }
    public int MinDigits { get; init; }
    public int MinSpecial { get; init; }
    public int MinUppercase { get; init; }
    public int MinLowercase { get; init; }
    public bool ForbidIdentityValues { get; init; }
}
