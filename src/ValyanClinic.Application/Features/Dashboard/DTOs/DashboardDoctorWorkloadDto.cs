namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardDoctorWorkloadDto
{
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    public string? SpecialtyName { get; init; }
    public int AppointmentCount { get; init; }
    public int CompletedCount { get; init; }
    public int NoShowCount { get; init; }
    public int ScheduledMinutes { get; init; }
}
