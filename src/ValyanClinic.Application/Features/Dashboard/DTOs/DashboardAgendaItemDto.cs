namespace ValyanClinic.Application.Features.Dashboard.DTOs;

public sealed record DashboardAgendaItemDto
{
    public Guid Id { get; init; }
    public DateTime StartTime { get; init; }
    public DateTime EndTime { get; init; }
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public string? PatientPhone { get; init; }
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    public string StatusCode { get; init; } = string.Empty;
    public string StatusName { get; init; } = string.Empty;
    /// <summary>Null când utilizatorul nu are acces la modulul consultations.</summary>
    public string? Notes { get; init; }
    /// <summary>Ora programării a trecut de pragul configurat și pacientul tot neconfirmat.</summary>
    public bool IsLate { get; init; }
}
