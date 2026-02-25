namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Abstractizare hashing parole — implementarea BCrypt e în Infrastructure.
/// </summary>
public interface IPasswordHasher
{
    /// <summary>Hash-uiește parola plain-text cu BCrypt.</summary>
    string HashPassword(string password);

    /// <summary>Verifică dacă parola plain-text corespunde hash-ului stocat.</summary>
    bool VerifyPassword(string password, string passwordHash);
}
