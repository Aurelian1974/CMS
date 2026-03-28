namespace ValyanClinic.Application.Features.AuditLogs.DTOs;

/// <summary>DTO pentru o înregistrare din jurnalul de audit.</summary>
public sealed class AuditLogDto
{
    public Guid Id { get; init; }
    public string EntityType { get; init; } = default!;
    public Guid EntityId { get; init; }
    public string Action { get; init; } = default!;
    public string? OldValues { get; init; }
    public string? NewValues { get; init; }
    public Guid ChangedBy { get; init; }
    public string? ChangedByName { get; init; }
    public DateTime ChangedAt { get; init; }
}

/// <summary>Rezultat paginat al jurnalului de audit.</summary>
public sealed class AuditLogPagedResult
{
    public required IReadOnlyList<AuditLogDto> Items { get; init; }
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}
