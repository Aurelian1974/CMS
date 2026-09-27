namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardActivityDto
{
    public Guid Id { get; init; }
    public string EntityType { get; init; } = string.Empty;
    public Guid EntityId { get; init; }
    public string Action { get; init; } = string.Empty;
    public DateTime ChangedAt { get; init; }
    public string? ChangedByName { get; init; }
}
