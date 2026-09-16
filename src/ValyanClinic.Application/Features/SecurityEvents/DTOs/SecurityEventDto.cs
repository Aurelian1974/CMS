namespace ValyanClinic.Application.Features.SecurityEvents.DTOs;

/// <summary>Un eveniment din jurnalul de securitate.</summary>
public sealed class SecurityEventDto
{
    public Guid Id { get; init; }
    public string EventType { get; init; } = default!;

    /// <summary>Null cand utilizatorul nu a putut fi identificat.</summary>
    public Guid? UserId { get; init; }
    public string? UserName { get; init; }
    public Guid? ClinicId { get; init; }

    /// <summary>Valoarea introdusa in formular la un login esuat.</summary>
    public string? EmailAttempted { get; init; }
    public string? IpAddress { get; init; }
    public string? UserAgent { get; init; }
    public bool Succeeded { get; init; }
    public string? Details { get; init; }
    public DateTime OccurredAt { get; init; }
}

/// <summary>Rezultat paginat al jurnalului de securitate.</summary>
public sealed class SecurityEventPagedResult
{
    public required IReadOnlyList<SecurityEventDto> Items { get; init; }
    public int TotalCount { get; init; }
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
}
