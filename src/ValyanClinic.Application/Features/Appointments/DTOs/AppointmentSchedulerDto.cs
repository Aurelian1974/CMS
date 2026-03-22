namespace ValyanClinic.Application.Features.Appointments.DTOs;

/// <summary>DTO simplificat pentru vizualizare scheduler — include doar datele necesare timeline-ului.</summary>
public sealed class AppointmentSchedulerDto
{
    public Guid Id { get; init; }
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public Guid StatusId { get; init; }
    public string StatusName { get; init; } = string.Empty;
    public string StatusCode { get; init; } = string.Empty;
    public string? Notes { get; init; }
}
