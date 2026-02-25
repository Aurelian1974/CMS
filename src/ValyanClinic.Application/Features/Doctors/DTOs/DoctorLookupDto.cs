namespace ValyanClinic.Application.Features.Doctors.DTOs;

/// <summary>DTO simplificat pentru dropdown-uri (selectare doctor).</summary>
public sealed class DoctorLookupDto
{
    public Guid Id { get; init; }
    public string FullName { get; init; } = string.Empty;
    public string? MedicalCode { get; init; }
    public Guid? SpecialtyId { get; init; }
    public string? SpecialtyName { get; init; }
    public Guid? DepartmentId { get; init; }
    public string? DepartmentName { get; init; }
}
