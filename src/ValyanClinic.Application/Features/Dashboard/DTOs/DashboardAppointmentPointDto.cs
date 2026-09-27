namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardAppointmentPointDto
{
    public DateOnly Date { get; init; }
    public int TotalCount { get; init; }
    public int CompletedCount { get; init; }
    public int CancelledCount { get; init; }
    public int NoShowCount { get; init; }
}
