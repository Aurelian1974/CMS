namespace ValyanClinic.Application.Features.Patients.DTOs;

/// <summary>DTO doctor asignat pacientului — include specialitate.</summary>
public sealed class PatientDoctorDto
{
    public Guid Id { get; init; }
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    public string? DoctorEmail { get; init; }
    public string? DoctorPhone { get; init; }
    public string? DoctorMedicalCode { get; init; }
    public string? DoctorSpecialtyName { get; init; }
    public bool IsPrimary { get; init; }
    public DateTime AssignedAt { get; init; }
    public string? Notes { get; init; }
    public bool IsActive { get; init; }
}
