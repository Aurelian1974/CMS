using ValyanClinic.Application.Features.Auth.Commands.Login;

namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Repository pentru operații de autentificare (login, refresh tokens, lockout).
/// </summary>
public interface IAuthRepository
{
    /// <summary>Caută utilizator după email sau username (fără filtru clinic — login flow).</summary>
    Task<UserAuthDto?> GetByEmailOrUsernameAsync(string emailOrUsername, CancellationToken ct);

    /// <summary>Incrementează contorul de login-uri eșuate + lockout dacă se depășește limita.</summary>
    Task IncrementFailedLoginAsync(Guid userId, int maxAttempts, int lockoutMinutes, CancellationToken ct);

    /// <summary>Resetează contorul de login-uri eșuate + setează LastLoginAt.</summary>
    Task ResetFailedLoginAsync(Guid userId, CancellationToken ct);

    /// <summary>Crează un refresh token nou în baza de date.</summary>
    Task CreateRefreshTokenAsync(Guid userId, string token, DateTime expiresAt, string? ipAddress, CancellationToken ct);

    /// <summary>Obține un refresh token după valoare.</summary>
    Task<RefreshTokenDto?> GetRefreshTokenAsync(string token, CancellationToken ct);

    /// <summary>Revocă un refresh token (cu opțiune de a indica token-ul înlocuitor).</summary>
    Task RevokeRefreshTokenAsync(string token, string? replacedByToken, CancellationToken ct);

    /// <summary>Revocă toate refresh token-urile unui utilizator.</summary>
    Task RevokeAllRefreshTokensAsync(Guid userId, CancellationToken ct);

    /// <summary>Obține datele utilizatorului după Id (pentru refresh token flow).</summary>
    Task<UserAuthDto?> GetUserByIdForTokenAsync(Guid userId, CancellationToken ct);
}

/// <summary>DTO pentru datele de autentificare ale utilizatorului (include PasswordHash).</summary>
public sealed record UserAuthDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid RoleId { get; init; }
    public string RoleName { get; init; } = string.Empty;
    public string RoleCode { get; init; } = string.Empty;
    public Guid? DoctorId { get; init; }
    public Guid? MedicalStaffId { get; init; }
    public string Username { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string PasswordHash { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public bool IsActive { get; init; }
    public DateTime? LastLoginAt { get; init; }
    public int FailedLoginAttempts { get; init; }
    public DateTime? LockoutEnd { get; init; }
}

/// <summary>DTO pentru un refresh token din baza de date.</summary>
public sealed record RefreshTokenDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string Token { get; init; } = string.Empty;
    public DateTime ExpiresAt { get; init; }
    public DateTime CreatedAt { get; init; }
    public DateTime? RevokedAt { get; init; }
    public string? ReplacedByToken { get; init; }
    public string? CreatedByIp { get; init; }

    /// <summary>Token-ul e activ dacă nu e revocat și nu e expirat.</summary>
    public bool IsActive => RevokedAt is null && ExpiresAt > DateTime.UtcNow;
}
