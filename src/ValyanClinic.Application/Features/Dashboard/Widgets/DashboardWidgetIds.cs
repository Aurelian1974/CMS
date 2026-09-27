namespace ValyanClinic.Application.Features.Dashboard.Widgets;

/// <summary>
/// Identificatorii widget-urilor. Sincron cu WIDGET_REGISTRY din
/// client/src/features/dashboard/widgets/widgetRegistry.tsx (verificat de teste în ambele părți).
/// </summary>
public static class DashboardWidgetIds
{
    // Clinical
    public const string KpiAppointmentsToday   = "kpi.appointments.today";
    public const string KpiConsultationsToday  = "kpi.consultations.today";
    public const string KpiConsultationsOpen   = "kpi.consultations.open";
    public const string KpiFollowUpsDue        = "kpi.followups.due";
    public const string KpiPatientsNewMonth    = "kpi.patients.new.month";
    public const string KpiPrescriptionsDraft  = "kpi.prescriptions.draft";

    // Agenda
    public const string ListAgendaToday        = "list.agenda.today";
    public const string ListConsultationsOpen  = "list.consultations.open";
    public const string ListLabResultsNew      = "list.lab.results.new";

    // Financial
    public const string KpiRevenueToday        = "kpi.revenue.today";
    public const string KpiRevenueMonth        = "kpi.revenue.month";
    public const string KpiUnpaidCount         = "kpi.unpaid.count";
    public const string KpiReceiptsAttention   = "kpi.receipts.attention";
    public const string KpiInvoicesMonth       = "kpi.invoices.month";
    public const string ListUnpaid             = "list.unpaid";
    public const string ListReceiptsFailed     = "list.receipts.failed";

    // Trend
    public const string ChartRevenueTrend      = "chart.revenue.trend";
    public const string ChartAppointmentsWeek  = "chart.appointments.week";
    public const string PanelNoShowRate        = "panel.noshow.rate";
    public const string PanelDoctorWorkload    = "panel.doctor.workload";
    public const string PanelTopServices       = "panel.top.services";

    // Health
    public const string ListActivity           = "list.activity";
    public const string ListSecurityEvents     = "list.security.events";
    public const string PanelLicensesExpiring  = "panel.licenses.expiring";
    public const string PanelInsuranceExpiring = "panel.insurance.expiring";
    public const string PanelUsersLocked       = "panel.users.locked";
    public const string PanelFreshnessAnm      = "panel.freshness.anm";
    public const string PanelFreshnessCnas     = "panel.freshness.cnas";
}
