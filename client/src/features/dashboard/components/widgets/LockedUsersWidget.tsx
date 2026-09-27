import { formatDateTime } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

export const LockedUsersWidget = ({ data }: DashboardWidgetProps) => {
  const items = data.health?.lockedUsers
  if (!items) return null

  return (
    <WidgetCard
      title="Conturi blocate"
      count={items.length}
      linkTo="/users"
      isEmpty={items.length === 0}
      emptyText="Niciun cont blocat."
    >
      <ul className={styles.list}>
        {items.map((u) => (
          <li key={u.id} className={styles.row}>
            <span className={styles.info}>
              <span className={styles.primary}>{u.fullName}</span>
              <span className={styles.secondary}>{u.email} · {u.failedLoginAttempts} încercări eșuate</span>
            </span>
            <span className={styles.secondary}>până la {formatDateTime(u.lockoutEnd!)}</span>
          </li>
        ))}
      </ul>
    </WidgetCard>
  )
}
