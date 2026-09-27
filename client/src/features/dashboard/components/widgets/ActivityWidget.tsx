import { formatDateTime } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

export const ActivityWidget = ({ data }: DashboardWidgetProps) => {
  const items = data.health?.activity
  if (!items) return null

  return (
    <WidgetCard
      title="Activitate recentă"
      isEmpty={items.length === 0}
      emptyText="Nicio activitate înregistrată."
    >
      <ul className={styles.timeline}>
        {items.map((a) => (
          <li key={a.id} className={styles.timelineRow}>
            <span className={styles.dot} aria-hidden />
            <span className={styles.info}>
              <span className={styles.primary}>{a.entityType} — {a.action}</span>
              <span className={styles.secondary}>
                {[a.changedByName, formatDateTime(a.changedAt!)].filter(Boolean).join(' · ')}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </WidgetCard>
  )
}
