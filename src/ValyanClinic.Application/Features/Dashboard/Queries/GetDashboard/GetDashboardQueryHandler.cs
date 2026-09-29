using MediatR;
using Microsoft.Extensions.Options;
using ValyanClinic.Application.Common.Configuration;
using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Common.Models;
using ValyanClinic.Application.Features.Dashboard.DTOs;
using ValyanClinic.Application.Features.Dashboard.Widgets;

namespace ValyanClinic.Application.Features.Dashboard.Queries.GetDashboard;

/// <summary>
/// Rolul alege preset-ul (ce widget-uri, în ce ordine); permisiunile efective decid ce
/// rămâne. Override-urile per utilizator se aplică fără cod dedicat.
/// </summary>
public sealed class GetDashboardQueryHandler(
    IDashboardRepository repository,
    IEffectivePermissions permissions,
    ICurrentUser currentUser,
    TimeProvider timeProvider,
    IOptions<DashboardOptions> options)
    : IRequestHandler<GetDashboardQuery, Result<DashboardDto>>
{
    public async Task<Result<DashboardDto>> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        var levels = await permissions.GetLevelsAsync(currentUser.Id, currentUser.RoleId, cancellationToken);

        var widgets = DashboardPresets.For(currentUser.Role)
            .Select(id => DashboardWidgetCatalog.All[id])
            .Where(w => DashboardWidgetCatalog.IsAllowed(w, levels))
            .ToList();

        var timeZone = ResolveTimeZone(options.Value.TimeZoneId);
        var nowUtc = timeProvider.GetUtcNow();
        var today = DateOnly.FromDateTime(TimeZoneInfo.ConvertTime(nowUtc, timeZone).DateTime);

        if (widgets.Count == 0)
            return Result<DashboardDto>.Success(new DashboardDto { GeneratedAt = nowUtc, Today = today });

        // Derivate din permisiuni și rol, niciodată din request: clientul nu poate cere
        // date clinice, iar un medic nu poate cere agenda altcuiva.
        var includeClinical = levels.TryGetValue(ModuleCodes.Consultations, out var consultationsLevel)
                              && consultationsLevel >= (int)AccessLevel.Read;
        // Soldul de încasat din fluxul pacienților e informație financiară
        var includeFinancial = levels.TryGetValue(ModuleCodes.Payments, out var paymentsLevel)
                               && paymentsLevel >= (int)AccessLevel.Read;
        // Relevanță, nu autorizare: medicul își vede ziua, restul rolurilor clinica.
        var onlyMine = currentUser.IsInRole(Roles.Doctor);

        var raw = await repository.GetAsync(
            new DashboardQueryData(
                ClinicId: currentUser.ClinicId,
                UserId: currentUser.Id,
                Today: today,
                SinceUtc: nowUtc.UtcDateTime.AddHours(-options.Value.SecurityWindowHours),
                Bundles: widgets.Select(w => w.Bundle).ToHashSet(),
                OnlyMine: onlyMine,
                IncludeClinical: includeClinical,
                TrendDays: request.TrendDays,
                Now: TimeZoneInfo.ConvertTime(nowUtc, timeZone).DateTime,
                IncludeFinancial: includeFinancial),
            cancellationToken);

        return Result<DashboardDto>.Success(DashboardResponseFilter.Compose(
            raw, widgets.Select(w => w.Id).ToList(), nowUtc, today, timeZone));
    }

    private static TimeZoneInfo ResolveTimeZone(string id) =>
        TimeZoneInfo.TryFindSystemTimeZoneById(id, out var tz) ? tz : TimeZoneInfo.Local;
}
