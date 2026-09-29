namespace ValyanClinic.Application.Features.Dashboard.DTOs;

/// <summary>Un pacient al zilei: programare (cu sau fără consultație) sau consultație fără programare.</summary>
public sealed record DashboardFlowItemDto
{
    public Guid? AppointmentId { get; init; }
    public Guid? ConsultationId { get; init; }
    /// <summary>Ora programării; pentru pacienții fără programare, deschiderea fișei.</summary>
    public DateTime Time { get; init; }
    public Guid PatientId { get; init; }
    public string PatientName { get; init; } = string.Empty;
    public Guid DoctorId { get; init; }
    public string DoctorName { get; init; } = string.Empty;
    public string? AppointmentStatusCode { get; init; }
    public string? AppointmentStatusName { get; init; }
    public string? ConsultationStatusCode { get; init; }
    public DateTime? StartedAt { get; init; }
    /// <summary>Vezi DashboardFlowStages.</summary>
    public string Stage { get; init; } = string.Empty;
    /// <summary>Null fără acces la modulul payments.</summary>
    public decimal? AmountDue { get; init; }
}
