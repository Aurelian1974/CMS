import { AppBadge } from '@/components/ui/AppBadge'
import { WidgetCard } from '../WidgetCard'
import { formatDaysLeft } from '../../utils/dashboardFormat'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

const daysVariant = (days: number) => (days < 0 ? 'danger' : days <= 14 ? 'warning' : 'info')

export const LicensesExpiringWidget = ({ data }: DashboardWidgetProps) => {
  const items = data.health?.expiringLicenses
  if (!items) return null

  return (
    <WidgetCard
      title="Avize CMR care expiră"
      count={items.length}
      linkTo="/doctors"
      isEmpty={items.length === 0}
      emptyText="Toate avizele sunt valabile."
    >
      <ul className={styles.list}>
        {items.map((l) => (
          <li key={l.doctorId} className={styles.row}>
            <span className={styles.info}>
              <span className={styles.primary}>{l.doctorName}</span>
              <span className={styles.secondary}>{l.licenseNumber ?? '—'}</span>
            </span>
            <AppBadge variant={daysVariant(l.daysLeft ?? 0)}>{formatDaysLeft(l.daysLeft ?? 0)}</AppBadge>
          </li>
        ))}
      </ul>
    </WidgetCard>
  )
}

export const InsuranceExpiringWidget = ({ data }: DashboardWidgetProps) => {
  const items = data.health?.expiringInsurance
  if (!items) return null

  return (
    <WidgetCard
      title="Asigurări pacienți expirate"
      count={items.length}
      linkTo="/patients"
      isEmpty={items.length === 0}
      emptyText="Nicio asigurare expirată la pacienții activi."
    >
      <ul className={styles.list}>
        {items.map((p) => (
          <li key={p.patientId} className={styles.row}>
            <span className={styles.info}>
              <span className={styles.primary}>{p.patientName}</span>
              <span className={styles.secondary}>
                {[p.insuranceNumber, p.phoneNumber].filter(Boolean).join(' · ') || '—'}
              </span>
            </span>
            <AppBadge variant={daysVariant(p.daysLeft ?? 0)}>{formatDaysLeft(p.daysLeft ?? 0)}</AppBadge>
          </li>
        ))}
      </ul>
    </WidgetCard>
  )
}
