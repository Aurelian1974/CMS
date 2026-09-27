import { formatDateTime } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

export const SecurityEventsWidget = ({ data }: DashboardWidgetProps) => {
  const items = data.health?.securityEvents
  if (!items) return null

  return (
    <WidgetCard
      title="Evenimente de securitate (24h)"
      count={items.length}
      linkTo="/audit/security"
      isEmpty={items.length === 0}
      emptyText="Niciun eveniment eșuat în ultimele 24 de ore."
    >
      <ul className={styles.timeline}>
        {items.map((e) => (
          <li key={e.id} className={styles.timelineRow}>
            <span className={`${styles.dot} ${styles.danger}`} aria-hidden />
            <span className={styles.info}>
              <span className={styles.primary}>{e.eventType}</span>
              <span className={styles.secondary}>
                {[e.userFullName ?? e.emailAttempted, e.ipAddress, formatDateTime(e.occurredAt!)]
                  .filter(Boolean).join(' · ')}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </WidgetCard>
  )
}
