import { AppBadge } from '@/components/ui/AppBadge'
import { formatDate } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

export const LabResultsWidget = ({ data }: DashboardWidgetProps) => {
  const items = data.agenda?.labResults
  if (!items) return null

  return (
    <WidgetCard
      title="Buletine de analize noi"
      count={items.length}
      isEmpty={items.length === 0}
      emptyText="Niciun buletin nou în ultimele zile."
    >
      <ul className={styles.list}>
        {items.map((r) => (
          <li key={r.id} className={styles.row}>
            <span className={styles.info}>
              <span className={styles.primary}>{r.patientName}</span>
              <span className={styles.secondary}>
                {[r.laboratory, r.bulletinNumber && `nr. ${r.bulletinNumber}`, r.resultDate && formatDate(r.resultDate)]
                  .filter(Boolean).join(' · ')}
              </span>
            </span>
            {(r.abnormalCount ?? 0) > 0
              ? <AppBadge variant="danger">{r.abnormalCount} în afara limitelor</AppBadge>
              : <AppBadge variant="success">în limite</AppBadge>}
          </li>
        ))}
      </ul>
    </WidgetCard>
  )
}
