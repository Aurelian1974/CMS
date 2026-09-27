using ValyanClinic.Application.Common.Enums;

namespace ValyanClinic.Application.Features.Dashboard.Widgets;

/// <summary>
/// Cerința de acces a unui widget. Modulele au semantica AND, ca ROUTE_MODULES din client:
/// widget-ul e permis doar cu nivelul cerut pe TOATE modulele.
/// </summary>
public sealed record DashboardWidgetSpec(
    string Id,
    DashboardBundle Bundle,
    AccessLevel RequiredLevel,
    params string[] RequiredModules);
