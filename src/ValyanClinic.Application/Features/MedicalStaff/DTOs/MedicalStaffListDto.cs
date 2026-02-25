namespace ValyanClinic.Application.Features.MedicalStaff.DTOs;

/// <summary>DTO listare personal medical — include denumirile relațiilor.</summary>
public sealed class MedicalStaffListDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid? DepartmentId { get; init; }
    public string? DepartmentName { get; init; }
    public Guid? SupervisorDoctorId { get; init; }
    public string? SupervisorName { get; init; }
    public Guid? MedicalTitleId { get; init; }
    public string? MedicalTitleName { get; init; }
    public string FirstName { get; init; } = string.Empty;
    public string LastName { get; init; } = string.Empty;
    public string FullName { get; init; } = string.Empty;
    public string Email { get; init; } = string.Empty;
    public string? PhoneNumber { get; init; }
    public bool IsActive { get; init; }
    public DateTime CreatedAt { get; init; }
}
