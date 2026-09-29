import { useState } from 'react'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import { ConsultationBillingModal } from '@/features/billing/components/ConsultationBillingModal'
import { PAYMENT_STATUS_LABELS, paymentStatusVariant } from '@/features/billing/constants/billing.constants'
import { formatCurrency, formatDate } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

export const UnpaidWidget = ({ data }: DashboardWidgetProps) => {
  const { canWrite } = useHasAccess()
  const [openId, setOpenId] = useState<string | null>(null)
  const items = data.financial?.unpaid
  if (!items) return null

  const canCollect = canWrite(MODULE.Payments)

  return (
    <>
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
                <span className={styles.secondary}>
                  {formatDate(u.date!)}{u.doctorName ? ` · Dr. ${u.doctorName}` : ''}
                </span>
              </span>
              <span className={styles.aside}>
                <span className={styles.amount}>{formatCurrency(u.balance ?? 0)}</span>
                <AppBadge variant={paymentStatusVariant(u.paymentStatus ?? '')}>
                  {PAYMENT_STATUS_LABELS[u.paymentStatus ?? ''] ?? u.paymentStatus}
                </AppBadge>
                {canCollect && (
                  <AppButton size="sm" onClick={() => setOpenId(u.consultationId ?? null)}>
                    Încasează
                  </AppButton>
                )}
              </span>
            </li>
          ))}
        </ul>
      </WidgetCard>
      <ConsultationBillingModal consultationId={openId} onClose={() => setOpenId(null)} />
    </>
  )
}
