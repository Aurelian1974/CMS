namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardExpiringLicenseDto
{
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    public string? LicenseNumber { get; init; }
    public DateOnly LicenseExpiresAt { get; init; }
    public int DaysLeft { get; init; }
}
