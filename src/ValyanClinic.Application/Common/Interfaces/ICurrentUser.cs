namespace ValyanClinic.Application.Common.Interfaces;

/// <summary>
/// Contract pentru accesarea datelor utilizatorului autentificat curent.
/// </summary>
public interface ICurrentUser
{
    Guid Id { get; }
    Guid ClinicId { get; }
    string Email { get; }
    string FullName { get; }
    string Role { get; }
    bool IsInRole(string role);
}
