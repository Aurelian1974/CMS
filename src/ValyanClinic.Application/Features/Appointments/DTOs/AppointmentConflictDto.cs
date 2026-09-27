namespace ValyanClinic.Application.Features.Appointments.DTOs;

/// <summary>Programare care se suprapune cu un interval propus.</summary>
public sealed class AppointmentConflictDto
{
    public Guid Id { get; init; }
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public string StatusName { get; init; } = string.Empty;
}
