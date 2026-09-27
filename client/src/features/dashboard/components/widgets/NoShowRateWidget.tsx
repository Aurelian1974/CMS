import { formatNumber } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

export const NoShowRateWidget = ({ data }: DashboardWidgetProps) => {
  const noShow = data.trends?.noShow
  if (!noShow) return null
  const days = data.trends?.appointments?.length ?? data.trends?.revenue?.length

  return (
    <WidgetCard title={days ? `Rată neprezentare (${days} zile)` : 'Rată neprezentare'}>
      <div className={styles.metric}>{formatNumber((noShow.noShowRate ?? 0) * 100, 1)}%</div>
      <p className={styles.metricHint}>
        {noShow.noShowCount ?? 0} neprezentări din {noShow.totalScheduled ?? 0} programări (fără anulări)
      </p>
    </WidgetCard>
  )
}
