namespace ValyanClinic.Application.Features.Appointments.DTOs;

/// <summary>Statistici programări — result set suplimentar din Appointment_GetPaged.</summary>
public sealed class AppointmentStatsDto
{
    public int TotalAppointments { get; init; }
    public int ScheduledCount { get; init; }
    public int ConfirmedCount { get; init; }
    public int CompletedCount { get; init; }
    public int CancelledCount { get; init; }
}
