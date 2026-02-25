using Microsoft.Extensions.Options;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Infrastructure.Configuration;

namespace ValyanClinic.Infrastructure.Authentication;

/// <summary>
/// Implementare BCrypt pentru hashing parole.
/// Work factor configurat din appsettings.json (Security:BcryptWorkFactor).
/// </summary>
public sealed class BcryptPasswordHasher(IOptions<SecurityOptions> options) : IPasswordHasher
{
    public string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.EnhancedHashPassword(password, options.Value.BcryptWorkFactor);
    }

    public bool VerifyPassword(string password, string passwordHash)
    {
        return BCrypt.Net.BCrypt.EnhancedVerify(password, passwordHash);
    }
}
