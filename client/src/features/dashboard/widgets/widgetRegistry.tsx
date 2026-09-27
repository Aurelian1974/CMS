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

export interface WidgetEntry {
  component: React.FC<DashboardWidgetProps>
  /** KPI-urile stau pe rândul de sus; cardurile dedesubt. Ordinea din fiecare grup vine de la server. */
  group: 'kpi' | 'card'
  /** Lățimea e decizie de prezentare a clientului, nu vine de la server. */
  colClass: string
}

const KPI  = { group: 'kpi',  colClass: 'col-sm-6 col-xl-3' } as const
const HALF = { group: 'card', colClass: 'col-xl-6' } as const

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

  'list.agenda.today':        { component: AgendaWidget,            ...HALF },
  'list.consultations.open':  { component: OpenConsultationsWidget, ...HALF },
  'list.lab.results.new':     { component: LabResultsWidget,        ...HALF },
  'list.unpaid':              { component: UnpaidWidget,            ...HALF },
  'list.receipts.failed':     { component: ReceiptIssuesWidget,     ...HALF },
  'list.activity':            { component: ActivityWidget,          ...HALF },
  'list.security.events':     { component: SecurityEventsWidget,    ...HALF },
}
