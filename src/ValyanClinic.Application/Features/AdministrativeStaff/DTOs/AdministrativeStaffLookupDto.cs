namespace ValyanClinic.Application.Features.AdministrativeStaff.DTOs;

/// <summary>DTO simplificat pentru dropdown-uri (ex: asociere cont utilizator).</summary>
public sealed class AdministrativeStaffLookupDto
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? Email { get; init; }
    public Guid? DepartmentId { get; init; }
    public string? DepartmentName { get; init; }
    public Guid? PositionId { get; init; }
    public string? PositionName { get; init; }
}
