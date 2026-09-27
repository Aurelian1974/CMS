namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardSyncFreshnessDto
{
    /// <summary>ANM sau CNAS — vezi DashboardSyncSources.</summary>
    public string Source { get; init; } = string.Empty;
    public DateTime? LastSuccessAt { get; init; }
    public string? LastStatus { get; init; }
    public DateTime? LastRunAt { get; init; }
}
