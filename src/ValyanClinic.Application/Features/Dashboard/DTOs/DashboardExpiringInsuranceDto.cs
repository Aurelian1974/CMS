namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardExpiringInsuranceDto
{
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public string? PhoneNumber { get; init; }
    public string? InsuranceNumber { get; init; }
    public DateOnly InsuranceExpiry { get; init; }
    public int DaysLeft { get; init; }
}
