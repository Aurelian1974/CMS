namespace ValyanClinic.Application.Features.Dashboard.DTOs;

/// <summary>
/// Dashboard-ul utilizatorului curent. <see cref="WidgetIds"/> dă ordinea de afișare;
/// secțiunile conțin doar datele widget-urilor permise, restul sunt null.
/// </summary>
public sealed record DashboardDto
{
    public DateTimeOffset GeneratedAt { get; init; }
    public DateOnly Today { get; init; }
    public IReadOnlyList<string> WidgetIds { get; init; } = [];
    public DashboardClinicalKpisDto? ClinicalKpis { get; init; }
    public DashboardAgendaDto? Agenda { get; init; }
    public DashboardFinancialDto? Financial { get; init; }
    public DashboardTrendsDto? Trends { get; init; }
    public DashboardHealthDto? Health { get; init; }
}
