namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardTopServiceDto
{
    public string ServiceName { get; init; } = string.Empty;
    public decimal Quantity { get; init; }
    public decimal TotalValue { get; init; }
}
