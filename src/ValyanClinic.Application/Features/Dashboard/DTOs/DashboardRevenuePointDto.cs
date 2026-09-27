namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardRevenuePointDto
{
    public DateOnly Date { get; init; }
    public decimal Amount { get; init; }
    public int PaymentCount { get; init; }
}
