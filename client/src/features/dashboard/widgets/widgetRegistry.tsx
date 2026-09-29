import type { DashboardWidgetProps } from '../types/dashboard.types'
import {
  KpiAppointmentsToday, KpiConsultationsOpen, KpiConsultationsToday, KpiFollowUpsDue,
  KpiInvoicesMonth, KpiPatientsNewMonth, KpiPrescriptionsDraft, KpiReceiptsAttention,
  KpiRevenueMonth, KpiRevenueToday, KpiUnpaidCount,
} from '../components/widgets/KpiWidgets'
import { AgendaWidget } from '../components/widgets/AgendaWidget'
import { OpenConsultationsWidget } from '../components/widgets/OpenConsultationsWidget'
import { LabResultsWidget } from '../components/widgets/LabResultsWidget'
import { UnpaidWidget } from '../components/widgets/UnpaidWidget'
import { ReceiptIssuesWidget } from '../components/widgets/ReceiptIssuesWidget'
import { ActivityWidget } from '../components/widgets/ActivityWidget'
import { SecurityEventsWidget } from '../components/widgets/SecurityEventsWidget'
import { RevenueTrendWidget } from '../components/widgets/RevenueTrendWidget'
import { AppointmentsWeekWidget } from '../components/widgets/AppointmentsWeekWidget'
import { NoShowRateWidget } from '../components/widgets/NoShowRateWidget'
import { DoctorWorkloadWidget } from '../components/widgets/DoctorWorkloadWidget'
import { TopServicesWidget } from '../components/widgets/TopServicesWidget'
import { InsuranceExpiringWidget, LicensesExpiringWidget } from '../components/widgets/ExpiringItemsWidgets'
import { LockedUsersWidget } from '../components/widgets/LockedUsersWidget'
import { FreshnessWidget } from '../components/widgets/FreshnessWidget'
import { PatientFlowWidget } from '../components/widgets/PatientFlowWidget'
import { AttentionWidget } from '../components/widgets/AttentionWidget'

export interface WidgetEntry {
  component: React.FC<DashboardWidgetProps>
  /** KPI-urile stau pe rândul de sus; cardurile dedesubt. Ordinea din fiecare grup vine de la server. */
  group: 'kpi' | 'card'
  /** Lățimea e decizie de prezentare a clientului, nu vine de la server. */
  colClass: string
  /** Widget redundant în contextul dat (ex. alt widget randează deja aceleași date). */
  skip?: (widgetIds: readonly string[]) => boolean
}

const KPI  = { group: 'kpi',  colClass: 'col-sm-6 col-xl-3' } as const
const HALF = { group: 'card', colClass: 'col-xl-6' } as const
const FULL = { group: 'card', colClass: 'col-12' } as const

/**
 * WidgetId → componentă. Id-urile sunt sincrone cu DashboardWidgetIds.cs (verificat de
 * widgetRegistry.test.ts). Un id necunoscut (backend mai nou) e ignorat de pagină.
 */
export const WIDGET_REGISTRY: Record<string, WidgetEntry> = {
  'kpi.appointments.today':  { component: KpiAppointmentsToday,  ...KPI },
  'kpi.consultations.today': { component: KpiConsultationsToday, ...KPI },
  'kpi.consultations.open':  { component: KpiConsultationsOpen,  ...KPI },
  'kpi.followups.due':       { component: KpiFollowUpsDue,       ...KPI },
  'kpi.patients.new.month':  { component: KpiPatientsNewMonth,   ...KPI },
  'kpi.prescriptions.draft': { component: KpiPrescriptionsDraft, ...KPI },
  'kpi.revenue.today':       { component: KpiRevenueToday,       ...KPI },
  'kpi.revenue.month':       { component: KpiRevenueMonth,       ...KPI },
  'kpi.unpaid.count':        { component: KpiUnpaidCount,        ...KPI },
  'kpi.receipts.attention':  { component: KpiReceiptsAttention,  ...KPI },
  'kpi.invoices.month':      { component: KpiInvoicesMonth,      ...KPI },

  'list.patient.flow.today':  { component: PatientFlowWidget,       ...FULL },
  'list.attention':           { component: AttentionWidget,         ...HALF },
  'list.agenda.today':        { component: AgendaWidget,            ...HALF },
  'list.consultations.open':  { component: OpenConsultationsWidget, ...HALF },
  'list.lab.results.new':     { component: LabResultsWidget,        ...HALF },
  'list.unpaid':              { component: UnpaidWidget,            ...HALF },
  'list.receipts.failed':     { component: ReceiptIssuesWidget,     ...HALF },
  'list.activity':            { component: ActivityWidget,          ...HALF },
  'list.security.events':     { component: SecurityEventsWidget,    ...HALF },

  'chart.revenue.trend':      { component: RevenueTrendWidget,      ...HALF },
  'chart.appointments.week':  { component: AppointmentsWeekWidget,  ...HALF },
  'panel.noshow.rate':        { component: NoShowRateWidget,        ...HALF },
  'panel.doctor.workload':    { component: DoctorWorkloadWidget,    ...HALF },
  'panel.top.services':       { component: TopServicesWidget,       ...HALF },
  'panel.licenses.expiring':  { component: LicensesExpiringWidget,  ...HALF },
  'panel.insurance.expiring': { component: InsuranceExpiringWidget, ...HALF },
  'panel.users.locked':       { component: LockedUsersWidget,       ...HALF },
  'panel.freshness.anm':      { component: FreshnessWidget,         ...HALF },
  'panel.freshness.cnas':     {
    component: FreshnessWidget,
    ...HALF,
    skip: (ids) => ids.includes('panel.freshness.anm'),
  },
}
