using System.Security.Cryptography;
using System.Text;

namespace ValyanClinic.Infrastructure.Authentication;

/// <summary>
/// Hashing pentru refresh token-uri înainte de stocare.
///
/// SHA-256, nu BCrypt: token-ul are deja 64 de bytes de entropie generați
/// crypto-secure, deci nu are nevoie de un KDF lent. Un KDF ar adăuga latență
/// pe un endpoint apelat la fiecare 15 minute de fiecare tab deschis și ar face
/// imposibil indexul unic pe coloana de hash.
///
/// Valoarea în clar există doar în cookie-ul HttpOnly al clientului.
/// Vezi DECIZII_ARHITECTURA_AUTH.md, decizia D2.
/// </summary>
internal static class RefreshTokenHasher
{
    /// <summary>Hash hex lowercase de 64 de caractere — corespunde CHAR(64) în DB.</summary>
    public static string Hash(string token)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(token)))
                  .ToLowerInvariant();
}
