import {
  AlertTriangle, Banknote, CalendarClock, CalendarDays, ClipboardList, FilePen,
  FileSpreadsheet, Receipt, Stethoscope, UserPlus, Wallet,
} from 'lucide-react'
import { StatCard } from '@/components/ui/StatCard'
import { formatCurrency } from '@/utils/format'
import type { DashboardDto, DashboardWidgetProps } from '../../types/dashboard.types'

type Color = 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'teal'

/** KPI generic: dacă serverul n-a trimis valoarea (nepermisă), nu se randează nimic. */
const makeKpi = (
  label: string,
  icon: React.ReactNode,
  color: Color,
  select: (d: DashboardDto) => number | null | undefined,
  format: (v: number) => string | number = (v) => v,
) => {
  const Kpi = ({ data }: DashboardWidgetProps) => {
    const value = select(data)
    if (value === null || value === undefined) return null
    return <StatCard label={label} value={format(value)} icon={icon} color={color} />
  }
  Kpi.displayName = `Kpi(${label})`
  return Kpi
}

const ICON = { size: 22, strokeWidth: 1.8, 'aria-hidden': true } as const

export const KpiAppointmentsToday = makeKpi(
  'Programări azi', <CalendarDays {...ICON} />, 'blue', (d) => d.clinicalKpis?.appointmentsToday)

export const KpiConsultationsToday = makeKpi(
  'Consultații azi', <Stethoscope {...ICON} />, 'purple', (d) => d.clinicalKpis?.consultationsToday)

export const KpiConsultationsOpen = makeKpi(
  'Consultații în lucru', <ClipboardList {...ICON} />, 'orange', (d) => d.clinicalKpis?.consultationsOpen)

export const KpiFollowUpsDue = makeKpi(
  'Reveniri de programat', <CalendarClock {...ICON} />, 'teal', (d) => d.clinicalKpis?.followUpsDue)

export const KpiPatientsNewMonth = makeKpi(
  'Pacienți noi (lună)', <UserPlus {...ICON} />, 'green', (d) => d.clinicalKpis?.patientsNewThisMonth)

export const KpiPrescriptionsDraft = makeKpi(
  'Rețete ciornă', <FilePen {...ICON} />, 'purple', (d) => d.clinicalKpis?.prescriptionsDraft)

export const KpiRevenueToday = makeKpi(
  'Încasări azi', <Banknote {...ICON} />, 'green', (d) => d.financial?.kpis?.revenueToday, formatCurrency)

export const KpiRevenueMonth = makeKpi(
  'Încasări (lună)', <Wallet {...ICON} />, 'orange', (d) => d.financial?.kpis?.revenueThisMonth, formatCurrency)

export const KpiUnpaidCount = makeKpi(
  'Consultații neîncasate', <AlertTriangle {...ICON} />, 'red',
  (d) => {
    const k = d.financial?.kpis
    return k?.unpaidCount == null ? k?.unpaidCount : k.unpaidCount + (k.partialCount ?? 0)
  })

export const KpiReceiptsAttention = makeKpi(
  'Bonuri de rezolvat', <Receipt {...ICON} />, 'red', (d) => d.financial?.kpis?.receiptsNeedingAttentionCount)

export const KpiInvoicesMonth = makeKpi(
  'Facturi emise (lună)', <FileSpreadsheet {...ICON} />, 'blue', (d) => d.financial?.kpis?.invoicesThisMonthCount)
