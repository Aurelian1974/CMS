namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardNoShowDto
{
    public int TotalScheduled { get; init; }
    public int NoShowCount { get; init; }
    public decimal NoShowRate { get; init; }
}
