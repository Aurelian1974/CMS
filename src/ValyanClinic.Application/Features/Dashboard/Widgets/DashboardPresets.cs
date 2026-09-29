using ValyanClinic.Application.Common.Constants;
using W = ValyanClinic.Application.Features.Dashboard.Widgets.DashboardWidgetIds;

namespace ValyanClinic.Application.Features.Dashboard.Widgets;

/// <summary>
/// Widget-urile implicite per rol, în ordinea de afișare. Preset-ul e o sugestie, nu o
/// autorizare: handler-ul filtrează apoi pe permisiunile efective, deci un widget la care
/// rolul n-are drept apare doar când un override i-l acordă.
/// </summary>
public static class DashboardPresets
{
    public static readonly IReadOnlyList<string> DefaultPreset =
    [
        W.KpiAppointmentsToday,
        W.ListAgendaToday,
    ];

    private static readonly Dictionary<string, IReadOnlyList<string>> ByRole = new(StringComparer.Ordinal)
    {
        [Roles.Doctor] =
        [
            W.KpiAppointmentsToday,
            W.KpiConsultationsOpen,
            W.KpiFollowUpsDue,
            W.KpiPrescriptionsDraft,
            // Vizibil doar cu override payments ≥ Read
            W.KpiRevenueToday,
            // Fluxul include și neconfirmații medicului, deci agenda de confirmat nu mai e necesară
            W.ListPatientFlowToday,
            W.ListAttention,
            W.ListConsultationsOpen,
            W.ListLabResultsNew,
        ],
        [Roles.Nurse] =
        [
            W.KpiAppointmentsToday,
            W.KpiConsultationsToday,
            W.KpiPatientsNewMonth,
            W.ListPatientFlowToday,
            W.ListAgendaToday,
            W.ListAttention,
            W.ListLabResultsNew,
        ],
        [Roles.Receptionist] =
        [
            W.KpiAppointmentsToday,
            W.KpiPatientsNewMonth,
            W.KpiRevenueToday,
            W.KpiUnpaidCount,
            W.KpiReceiptsAttention,
            W.ListPatientFlowToday,
            W.ListAgendaToday,
            W.ListAttention,
            W.ListUnpaid,
            W.ListReceiptsFailed,
        ],
        [Roles.ClinicManager] =
        [
            W.KpiRevenueMonth,
            W.KpiInvoicesMonth,
            W.KpiAppointmentsToday,
            W.KpiPatientsNewMonth,
            W.ListPatientFlowToday,
            W.ChartRevenueTrend,
            W.ChartAppointmentsWeek,
            W.PanelNoShowRate,
            W.PanelDoctorWorkload,
            W.PanelTopServices,
        ],
        [Roles.Admin] =
        [
            W.KpiAppointmentsToday,
            W.KpiRevenueToday,
            W.ListSecurityEvents,
            W.PanelUsersLocked,
            W.PanelLicensesExpiring,
            W.PanelInsuranceExpiring,
            W.PanelFreshnessAnm,
            W.PanelFreshnessCnas,
            W.ListActivity,
        ],
    };

    public static IReadOnlyList<string> For(string roleCode) =>
        ByRole.TryGetValue(roleCode, out var preset) ? preset : DefaultPreset;

    public static IEnumerable<IReadOnlyList<string>> AllPresets => ByRole.Values.Append(DefaultPreset);
}
