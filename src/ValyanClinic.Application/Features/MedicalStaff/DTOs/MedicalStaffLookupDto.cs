namespace ValyanClinic.Application.Features.MedicalStaff.DTOs;

/// <summary>DTO simplificat pentru dropdown-uri și listare per departament.</summary>
public sealed class MedicalStaffLookupDto
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string? Email { get; init; }
    public Guid? DepartmentId { get; init; }
    public string? DepartmentName { get; init; }
    public Guid? MedicalTitleId { get; init; }
    public string? MedicalTitleName { get; init; }
}
