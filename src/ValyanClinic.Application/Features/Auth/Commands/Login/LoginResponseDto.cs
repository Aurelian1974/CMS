namespace ValyanClinic.Application.Features.Auth.Commands.Login;

/// <summary>
/// DTO returnat la login reușit — access token + datele utilizatorului.
/// </summary>
public sealed record LoginResponseDto
{
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;

    /// <summary>
    /// Momentul expirarii refresh token-ului, calculat din setarea rolului.
    /// Controller-ul il foloseste pentru cookie in loc sa recalculeze dintr-o
    /// valoare globala — altfel cookie-ul si randul din baza de date ar putea diverge.
    /// </summary>
    public DateTime RefreshTokenExpiresAt { get; init; }
    public AuthUserDto User { get; init; } = null!;
    public IReadOnlyList<ModulePermissionDto> Permissions { get; init; } = [];
}

/// <summary>
/// DTO permisiune pe modul returnată la login (nivel efectiv = rol + override).
/// </summary>
public sealed record ModulePermissionDto
{
    public string Module { get; init; } = string.Empty;
    public int Level { get; init; }
    public bool IsOverridden { get; init; }
}

/// <summary>
/// DTO cu datele utilizatorului autentificat (fără date sensibile).
/// </summary>
public sealed record AuthUserDto
{
    public string Id { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Role { get; init; } = string.Empty;
    public string RoleId { get; init; } = string.Empty;
    public string ClinicId { get; init; } = string.Empty;
    public string? DoctorId { get; init; }

    /// <summary>
    /// Contul trebuie sa isi schimbe parola inainte de a continua — setat dupa un
    /// reset administrativ. Clientul forteaza ecranul de schimbare cat timp e true.
    /// </summary>
    public bool MustChangePassword { get; init; }
}
