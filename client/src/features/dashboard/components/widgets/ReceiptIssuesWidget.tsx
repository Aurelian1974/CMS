import { AppBadge } from '@/components/ui/AppBadge'
import { receiptStatusVariant } from '@/features/billing/constants/billing.constants'
import { formatDateTime } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

export const ReceiptIssuesWidget = ({ data }: DashboardWidgetProps) => {
  const items = data.financial?.receiptIssues
  if (!items) return null

  return (
    <WidgetCard
      title="Bonuri fiscale de rezolvat"
      count={items.length}
      linkTo="/billing"
      isEmpty={items.length === 0}
      emptyText="Toate bonurile sunt tipărite."
    >
      <ul className={styles.list}>
        {items.map((r) => (
          <li key={r.id} className={styles.row}>
            <span className={styles.info}>
              <span className={styles.primary}>{r.patientName}</span>
              <span className={styles.secondary}>{formatDateTime(r.createdAt!)}</span>
            </span>
            <AppBadge variant={receiptStatusVariant(r.statusCode ?? null)} withDot>{r.statusName}</AppBadge>
          </li>
        ))}
      </ul>
    </WidgetCard>
  )
}
