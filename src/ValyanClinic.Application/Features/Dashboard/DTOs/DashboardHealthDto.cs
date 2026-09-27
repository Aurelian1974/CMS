namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardHealthDto
{
    public IReadOnlyList<DashboardSecurityEventDto>? SecurityEvents { get; init; }
    public IReadOnlyList<DashboardLockedUserDto>? LockedUsers { get; init; }
    public IReadOnlyList<DashboardExpiringLicenseDto>? ExpiringLicenses { get; init; }
    public IReadOnlyList<DashboardExpiringInsuranceDto>? ExpiringInsurance { get; init; }
    public IReadOnlyList<DashboardSyncFreshnessDto>? SyncFreshness { get; init; }
    public IReadOnlyList<DashboardActivityDto>? Activity { get; init; }
}
