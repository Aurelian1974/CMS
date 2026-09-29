namespace ValyanClinic.Application.Features.Dashboard.DTOs;

/// <summary>Fluxul pacienților de azi + situațiile rămase nerezolvate; o listă nepermisă rămâne null.</summary>
public sealed record DashboardFlowDto
{
    public IReadOnlyList<DashboardFlowItemDto>? Items { get; init; }
    public IReadOnlyList<DashboardAttentionItemDto>? Attention { get; init; }
}
