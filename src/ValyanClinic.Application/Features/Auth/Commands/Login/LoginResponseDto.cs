namespace ValyanClinic.Application.Features.Auth.Commands.Login;

/// <summary>
/// DTO returnat la login reușit — access token + datele utilizatorului.
/// </summary>
public sealed record LoginResponseDto
{
    public string AccessToken { get; init; } = string.Empty;
    public string RefreshToken { get; init; } = string.Empty;
    public AuthUserDto User { get; init; } = null!;
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
    public string ClinicId { get; init; } = string.Empty;
}
