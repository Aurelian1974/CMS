using ValyanClinic.Application.Features.Dashboard.DTOs;
using ValyanClinic.Application.Features.Dashboard.Widgets;

namespace ValyanClinic.Application.Common.Interfaces;

public interface IDashboardRepository
{
    /// <summary>Execută doar SP-urile bundle-urilor cerute; secțiunile neexecutate rămân null.</summary>
    Task<DashboardRawData> GetAsync(DashboardQueryData query, CancellationToken ct);
}

/// <summary>
/// Parametrii derivați pe server din ICurrentUser + permisiuni. OnlyMine,
/// IncludeClinical și IncludeFinancial nu vin niciodată din request.
/// Now = ora curentă în fusul clinicii (pentru „întârziat”).
/// </summary>
public sealed record DashboardQueryData(
    Guid ClinicId,
    Guid UserId,
    DateOnly Today,
    DateTime SinceUtc,
    IReadOnlySet<DashboardBundle> Bundles,
    bool OnlyMine,
    bool IncludeClinical,
    int TrendDays,
    DateTime? Now = null,
    bool IncludeFinancial = false);

public sealed record DashboardRawData(
    DashboardClinicalKpisDto? ClinicalKpis,
    DashboardAgendaDto? Agenda,
    DashboardFinancialDto? Financial,
    DashboardTrendsDto? Trends,
    DashboardHealthDto? Health,
    DashboardFlowDto? Flow = null)
{
    public static readonly DashboardRawData Empty = new(null, null, null, null, null);
}
