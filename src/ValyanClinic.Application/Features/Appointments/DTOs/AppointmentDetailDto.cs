namespace ValyanClinic.Application.Features.Appointments.DTOs;

/// <summary>DTO detalii programare — include date suplimentare față de listare.</summary>
public sealed class AppointmentDetailDto
{
    public Guid Id { get; init; }
    public Guid ClinicId { get; init; }
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public string? PatientPhone { get; init; }
    public string? PatientCnp { get; init; }
    public string? PatientEmail { get; init; }
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    public string? SpecialtyName { get; init; }
    public string? DoctorMedicalCode { get; init; }
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public Guid StatusId { get; init; }
    public string StatusName { get; init; } = string.Empty;
    public string StatusCode { get; init; } = string.Empty;
    public string? Notes { get; init; }
    public bool IsDeleted { get; init; }
    public DateTime CreatedAt { get; init; }
    public string? CreatedByName { get; init; }
    public DateTime? UpdatedAt { get; init; }
    public Guid? UpdatedBy { get; init; }
    public string? UpdatedByName { get; init; }
}
