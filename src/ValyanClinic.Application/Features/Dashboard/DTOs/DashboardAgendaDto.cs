namespace ValyanClinic.Application.Features.Dashboard.DTOs;

/// <summary>Listele zilei; o listă nepermisă rămâne null (nu goală).</summary>
public sealed record DashboardAgendaDto
{
    public IReadOnlyList<DashboardAgendaItemDto>? Appointments { get; init; }
    public IReadOnlyList<DashboardOpenConsultationDto>? OpenConsultations { get; init; }
    public IReadOnlyList<DashboardLabResultDto>? LabResults { get; init; }
}
