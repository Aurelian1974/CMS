import { AppBadge } from '@/components/ui/AppBadge'
import { formatDate } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import { htmlToText } from '../../utils/dashboardFormat'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

export const OpenConsultationsWidget = ({ data }: DashboardWidgetProps) => {
  const items = data.agenda?.openConsultations
  if (!items) return null

  return (
    <WidgetCard
      title="Consultații în lucru"
      count={items.length}
      linkTo="/consultations"
      isEmpty={items.length === 0}
      emptyText="Nicio consultație deschisă."
    >
      <ul className={styles.list}>
        {items.map((c) => {
          const detail = c.diagnostic || htmlToText(c.motiv)
          return (
            <li key={c.id} className={styles.row}>
              <span className={styles.info}>
                <span className={styles.primary}>{c.patientName}</span>
                <span className={styles.secondary}>
                  {formatDate(c.date!)} · {c.doctorName}
                  {detail ? ` · ${detail}` : ''}
                </span>
              </span>
              <AppBadge variant={(c.daysOpen ?? 0) > 2 ? 'warning' : 'neutral'}>
                {c.daysOpen === 0 ? 'azi' : `${c.daysOpen} zile`}
              </AppBadge>
            </li>
          )
        })}
      </ul>
    </WidgetCard>
  )
}
