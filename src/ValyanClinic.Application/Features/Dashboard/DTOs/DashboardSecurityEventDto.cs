namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardSecurityEventDto
{
    public Guid Id { get; init; }
    public string EventType { get; init; } = string.Empty;
    public bool Succeeded { get; init; }
    /// <summary>Convertit din UTC în ora clinicii de handler.</summary>
    public DateTime OccurredAt { get; init; }
    public string? EmailAttempted { get; init; }
    public string? IpAddress { get; init; }
    public string? UserFullName { get; init; }
}
