using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Enums;
using W = ValyanClinic.Application.Features.Dashboard.Widgets.DashboardWidgetIds;

namespace ValyanClinic.Application.Features.Dashboard.Widgets;

/// <summary>Singurul criteriu de vizibilitate al unui widget: modul(e) + nivel minim.</summary>
public static class DashboardWidgetCatalog
{
    private const AccessLevel Read = AccessLevel.Read;

    public static readonly IReadOnlyDictionary<string, DashboardWidgetSpec> All =
        new DashboardWidgetSpec[]
        {
            new(W.KpiAppointmentsToday,   DashboardBundle.Clinical,  Read, ModuleCodes.Appointments),
            new(W.KpiConsultationsToday,  DashboardBundle.Clinical,  Read, ModuleCodes.Consultations),
            new(W.KpiConsultationsOpen,   DashboardBundle.Clinical,  Read, ModuleCodes.Consultations),
            new(W.KpiFollowUpsDue,        DashboardBundle.Clinical,  Read, ModuleCodes.Consultations),
            new(W.KpiPatientsNewMonth,    DashboardBundle.Clinical,  Read, ModuleCodes.Patients),
            new(W.KpiPrescriptionsDraft,  DashboardBundle.Clinical,  Read, ModuleCodes.Prescriptions),

            new(W.ListAgendaToday,        DashboardBundle.Agenda,    Read, ModuleCodes.Appointments),
            new(W.ListConsultationsOpen,  DashboardBundle.Agenda,    Read, ModuleCodes.Consultations),
            new(W.ListLabResultsNew,      DashboardBundle.Agenda,    Read, ModuleCodes.Consultations),

            new(W.ListPatientFlowToday,   DashboardBundle.Flow,      Read, ModuleCodes.Appointments),
            new(W.ListAttention,          DashboardBundle.Flow,      Read, ModuleCodes.Appointments),

            new(W.KpiRevenueToday,        DashboardBundle.Financial, Read, ModuleCodes.Payments),
            new(W.KpiRevenueMonth,        DashboardBundle.Financial, Read, ModuleCodes.Payments),
            new(W.KpiUnpaidCount,         DashboardBundle.Financial, Read, ModuleCodes.Payments),
            new(W.KpiReceiptsAttention,   DashboardBundle.Financial, Read, ModuleCodes.Payments),
            new(W.KpiInvoicesMonth,       DashboardBundle.Financial, Read, ModuleCodes.Invoices),
            new(W.ListUnpaid,             DashboardBundle.Financial, Read, ModuleCodes.Payments),
            new(W.ListReceiptsFailed,     DashboardBundle.Financial, Read, ModuleCodes.Payments),

            new(W.ChartRevenueTrend,      DashboardBundle.Trend,     Read, ModuleCodes.Payments),
            new(W.ChartAppointmentsWeek,  DashboardBundle.Trend,     Read, ModuleCodes.Appointments),
            new(W.PanelNoShowRate,        DashboardBundle.Trend,     Read, ModuleCodes.Appointments),
            new(W.PanelDoctorWorkload,    DashboardBundle.Trend,     Read, ModuleCodes.Appointments, ModuleCodes.Users),
            new(W.PanelTopServices,       DashboardBundle.Trend,     Read, ModuleCodes.Tariffs, ModuleCodes.Payments),

            new(W.ListActivity,           DashboardBundle.Health,    Read, ModuleCodes.Audit),
            new(W.ListSecurityEvents,     DashboardBundle.Health,    Read, ModuleCodes.Audit),
            new(W.PanelLicensesExpiring,  DashboardBundle.Health,    Read, ModuleCodes.Users),
            new(W.PanelInsuranceExpiring, DashboardBundle.Health,    Read, ModuleCodes.Patients),
            new(W.PanelUsersLocked,       DashboardBundle.Health,    Read, ModuleCodes.Users),
            new(W.PanelFreshnessAnm,      DashboardBundle.Health,    Read, ModuleCodes.Anm),
            new(W.PanelFreshnessCnas,     DashboardBundle.Health,    Read, ModuleCodes.Cnas),
        }.ToDictionary(w => w.Id, StringComparer.Ordinal);

    public static bool IsAllowed(DashboardWidgetSpec widget, IReadOnlyDictionary<string, int> levels) =>
        widget.RequiredModules.All(m => levels.TryGetValue(m, out var level) && level >= (int)widget.RequiredLevel);
}
