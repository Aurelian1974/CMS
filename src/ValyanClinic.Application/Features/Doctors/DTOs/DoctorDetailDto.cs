namespace ValyanClinic.Application.Features.Doctors.DTOs;

/// <summary>DTO detalii doctor — include toate câmpurile + denumirile relațiilor.</summary>
public sealed class DoctorDetailDto
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
    public DateTime? UpdatedAt { get; init; }
}
