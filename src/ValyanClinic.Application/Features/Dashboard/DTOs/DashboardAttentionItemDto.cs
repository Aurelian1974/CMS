namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardAttentionItemDto
{
    /// <summary>Vezi DashboardAttentionTypes.</summary>
    public string Type { get; init; } = string.Empty;
    public Guid? AppointmentId { get; init; }
    public Guid? ConsultationId { get; init; }
    public DateTime OccurredAt { get; init; }
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    /// <summary>Starea programării sau, pentru consultații, a consultației.</summary>
    public string? StatusCode { get; init; }
    public string? StatusName { get; init; }
    public int DaysOpen { get; init; }
}
