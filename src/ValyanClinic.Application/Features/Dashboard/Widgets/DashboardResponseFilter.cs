using ValyanClinic.Application.Common.Constants;
using ValyanClinic.Application.Common.Interfaces;
using ValyanClinic.Application.Features.Dashboard.DTOs;
using W = ValyanClinic.Application.Features.Dashboard.Widgets.DashboardWidgetIds;

namespace ValyanClinic.Application.Features.Dashboard.Widgets;

/// <summary>
/// Păstrează din datele brute doar câmpurile widget-urilor permise. Un bundle servește
/// mai multe widget-uri (ex. contoarele clinice), deci un widget permis nu trebuie să
/// aducă în răspuns contoarele vecine la care utilizatorul nu are drept.
/// </summary>
public static class DashboardResponseFilter
{
    public static DashboardDto Compose(
        DashboardRawData raw,
        IReadOnlyList<string> widgetIds,
        DateTimeOffset generatedAt,
        DateOnly today,
        TimeZoneInfo timeZone)
    {
        var ids = widgetIds.ToHashSet(StringComparer.Ordinal);
        bool Has(string id) => ids.Contains(id);
        T? Keep<T>(string id, T? value) where T : class => Has(id) ? value : null;
        TV? KeepV<TV>(string id, TV? value) where TV : struct => Has(id) ? value : null;

        var clinical = raw.ClinicalKpis is { } k
            ? new DashboardClinicalKpisDto
            {
                AppointmentsToday                  = KeepV(W.KpiAppointmentsToday, k.AppointmentsToday),
                AppointmentsTodayRemaining         = KeepV(W.KpiAppointmentsToday, k.AppointmentsTodayRemaining),
                ConsultationsToday                 = KeepV(W.KpiConsultationsToday, k.ConsultationsToday),
                ConsultationsOpen                  = KeepV(W.KpiConsultationsOpen, k.ConsultationsOpen),
                FollowUpsDue                       = KeepV(W.KpiFollowUpsDue, k.FollowUpsDue),
                PatientsNewThisMonth               = KeepV(W.KpiPatientsNewMonth, k.PatientsNewThisMonth),
                PrescriptionsDraft                 = KeepV(W.KpiPrescriptionsDraft, k.PrescriptionsDraft),
                PrescriptionsWithTransmissionError = KeepV(W.KpiPrescriptionsDraft, k.PrescriptionsWithTransmissionError),
            }
            : null;

        var agenda = raw.Agenda is { } a
            ? new DashboardAgendaDto
            {
                Appointments      = Keep(W.ListAgendaToday, a.Appointments),
                OpenConsultations = Keep(W.ListConsultationsOpen, a.OpenConsultations),
                LabResults        = Keep(W.ListLabResultsNew, a.LabResults),
            }
            : null;

        var financial = raw.Financial is { } f
            ? new DashboardFinancialDto
            {
                Kpis = f.Kpis is { } fk
                    ? new DashboardFinancialKpisDto
                    {
                        RevenueToday                  = KeepV(W.KpiRevenueToday, fk.RevenueToday),
                        RevenueThisMonth              = KeepV(W.KpiRevenueMonth, fk.RevenueThisMonth),
                        InvoicesThisMonthCount        = KeepV(W.KpiInvoicesMonth, fk.InvoicesThisMonthCount),
                        InvoicesThisMonthNetTotal     = KeepV(W.KpiInvoicesMonth, fk.InvoicesThisMonthNetTotal),
                        UnpaidCount                   = KeepV(W.KpiUnpaidCount, fk.UnpaidCount),
                        PartialCount                  = KeepV(W.KpiUnpaidCount, fk.PartialCount),
                        OutstandingTotal              = KeepV(W.KpiUnpaidCount, fk.OutstandingTotal),
                        ReceiptsNeedingAttentionCount = KeepV(W.KpiReceiptsAttention, fk.ReceiptsNeedingAttentionCount),
                    }
                    : null,
                Unpaid        = Keep(W.ListUnpaid, f.Unpaid),
                ReceiptIssues = Keep(W.ListReceiptsFailed, f.ReceiptIssues),
            }
            : null;

        var trends = raw.Trends is { } t
            ? new DashboardTrendsDto
            {
                Revenue        = Keep(W.ChartRevenueTrend, t.Revenue),
                Appointments   = Keep(W.ChartAppointmentsWeek, t.Appointments),
                NoShow         = Keep(W.PanelNoShowRate, t.NoShow),
                DoctorWorkload = Keep(W.PanelDoctorWorkload, t.DoctorWorkload),
                TopServices    = Keep(W.PanelTopServices, t.TopServices),
            }
            : null;

        var health = raw.Health is { } h
            ? new DashboardHealthDto
            {
                SecurityEvents = Has(W.ListSecurityEvents)
                    ? h.SecurityEvents?.Select(e => e with { OccurredAt = ToLocal(e.OccurredAt, timeZone) }).ToList()
                    : null,
                LockedUsers       = Keep(W.PanelUsersLocked, h.LockedUsers),
                ExpiringLicenses  = Keep(W.PanelLicensesExpiring, h.ExpiringLicenses),
                ExpiringInsurance = Keep(W.PanelInsuranceExpiring, h.ExpiringInsurance),
                SyncFreshness     = h.SyncFreshness?
                    .Where(s => (s.Source == DashboardSyncSources.Anm && Has(W.PanelFreshnessAnm))
                             || (s.Source == DashboardSyncSources.Cnas && Has(W.PanelFreshnessCnas)))
                    .ToList() is { Count: > 0 } fresh ? fresh : null,
                Activity = Keep(W.ListActivity, h.Activity),
            }
            : null;

        var flow = raw.Flow is { } fl
            ? new DashboardFlowDto
            {
                Items     = Keep(W.ListPatientFlowToday, fl.Items),
                Attention = Keep(W.ListAttention, fl.Attention),
            }
            : null;

        return new DashboardDto
        {
            GeneratedAt  = generatedAt,
            Today        = today,
            WidgetIds    = widgetIds,
            ClinicalKpis = clinical,
            Agenda       = agenda,
            Financial    = financial,
            Trends       = trends,
            Health       = health,
            Flow         = flow,
        };
    }

    // SecurityEvents.OccurredAt e scris în UTC; restul schemei e deja în ora clinicii.
    private static DateTime ToLocal(DateTime utc, TimeZoneInfo timeZone) =>
        TimeZoneInfo.ConvertTimeFromUtc(DateTime.SpecifyKind(utc, DateTimeKind.Utc), timeZone);
}
