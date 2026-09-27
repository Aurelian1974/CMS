import { AppBadge } from '@/components/ui/AppBadge'
import { formatDateTime } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

const STALE_DAYS = 45
const SUCCESS = 'Success'

const isStale = (iso: string | null | undefined) =>
  !iso || Date.now() - new Date(iso).getTime() > STALE_DAYS * 24 * 60 * 60 * 1000

/**
 * Un singur card pentru ambele surse: serverul trimite doar sursele permise, iar
 * registry-ul sare peste widget-ul CNAS când e prezent și cel ANM.
 */
export const FreshnessWidget = ({ data }: DashboardWidgetProps) => {
  const items = data.health?.syncFreshness
  if (!items || items.length === 0) return null

  return (
    <WidgetCard title="Prospețimea nomenclatoarelor">
      <ul className={styles.list}>
        {items.map((s) => {
          const stale = isStale(s.lastSuccessAt)
          return (
            <li key={s.source} className={styles.row}>
              <span className={styles.info}>
                <span className={styles.primary}>{s.source}</span>
                <span className={styles.secondary}>
                  Ultima sincronizare reușită: {s.lastSuccessAt ? formatDateTime(s.lastSuccessAt) : 'niciodată'}
                </span>
              </span>
              {s.lastStatus && s.lastStatus !== SUCCESS
                ? <AppBadge variant="danger">{s.lastStatus}</AppBadge>
                : <AppBadge variant={stale ? 'warning' : 'success'}>{stale ? 'învechit' : 'la zi'}</AppBadge>}
            </li>
          )
        })}
      </ul>
    </WidgetCard>
  )
}
