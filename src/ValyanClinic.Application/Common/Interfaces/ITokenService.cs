namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Abstractizare generare token-uri JWT — implementarea e în Infrastructure.
/// </summary>
public interface ITokenService
{
    /// <summary>Generează un access token JWT cu claims-urile utilizatorului.</summary>
    string GenerateAccessToken(Guid userId, Guid clinicId, string email, string fullName, string role, Guid roleId);

    /// <summary>Generează un refresh token random (crypto-secure base64).</summary>
    string GenerateRefreshToken();
}
