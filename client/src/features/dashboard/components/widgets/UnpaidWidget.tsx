import { AppBadge } from '@/components/ui/AppBadge'
import { PAYMENT_STATUS_LABELS, paymentStatusVariant } from '@/features/billing/constants/billing.constants'
import { formatCurrency, formatDate } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

export const UnpaidWidget = ({ data }: DashboardWidgetProps) => {
  const items = data.financial?.unpaid
  if (!items) return null

  return (
    <WidgetCard
      title="De încasat"
      count={items.length}
      linkTo="/billing"
      isEmpty={items.length === 0}
      emptyText="Nicio restanță."
    >
      <ul className={styles.list}>
        {items.map((u) => (
          <li key={u.consultationId} className={styles.row}>
            <span className={styles.info}>
              <span className={styles.primary}>{u.patientName}</span>
              <span className={styles.secondary}>{formatDate(u.date!)}</span>
            </span>
            <span className={styles.aside}>
              <span className={styles.amount}>{formatCurrency(u.balance ?? 0)}</span>
              <AppBadge variant={paymentStatusVariant(u.paymentStatus ?? '')}>
                {PAYMENT_STATUS_LABELS[u.paymentStatus ?? ''] ?? u.paymentStatus}
              </AppBadge>
            </span>
          </li>
        ))}
      </ul>
    </WidgetCard>
  )
}
