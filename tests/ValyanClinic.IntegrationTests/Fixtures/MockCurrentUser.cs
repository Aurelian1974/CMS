using ValyanClinic.Application.Common.Interfaces;

namespace ValyanClinic.IntegrationTests.Fixtures;

/// <summary>
/// Implementare ICurrentUser pentru integration tests — inject ClinicId și UserId ficitiți,
/// suficient pentru a satisface repository-urile care filtrează după ClinicId.
/// </summary>
public sealed class MockCurrentUser : ICurrentUser
{
    public MockCurrentUser(Guid clinicId, Guid userId)
    {
        ClinicId = clinicId;
        Id       = userId;
    }

    public Guid   Id       { get; }
    public Guid   ClinicId { get; }
    public Guid   RoleId   => Guid.Empty;
    public string Email    => "integration-test@valyan.test";
    public string FullName => "Integration Test";
    public string Role     => "Admin";

    public bool IsInRole(string role) => role == "Admin";
}
