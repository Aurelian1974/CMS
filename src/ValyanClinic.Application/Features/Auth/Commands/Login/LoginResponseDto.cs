namespace ValyanClinic.Application.Features.Auth.Commands.Login;

/// <summary>
/// DTO returnat la login reușit — access token + datele utilizatorului.
/// </summary>
public sealed record LoginResponseDto
{
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
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
}
