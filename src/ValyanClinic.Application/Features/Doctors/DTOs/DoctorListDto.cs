namespace ValyanClinic.Application.Features.Doctors.DTOs;

/// <summary>DTO listare doctor — include denumirile relațiilor (departament, supervisor, specializare, subspecializare).</summary>
public sealed class DoctorListDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid? DepartmentId { get; init; }
    public string? DepartmentName { get; init; }
    public Guid? SupervisorDoctorId { get; init; }
    public string? SupervisorName { get; init; }
    public Guid? SpecialtyId { get; init; }
    public string? SpecialtyName { get; init; }
    public Guid? SubspecialtyId { get; init; }
    public string? SubspecialtyName { get; init; }
    public Guid? MedicalTitleId { get; init; }
    public string? MedicalTitleName { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? PhoneNumber { get; init; }
    public string? MedicalCode { get; init; }
    public string? LicenseNumber { get; init; }
    public DateTime? LicenseExpiresAt { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}
