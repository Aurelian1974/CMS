import { formatCurrency } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import { TrendChart } from '../TrendChart'
import { formatDayMonth } from '../../utils/dashboardFormat'
import type { DashboardWidgetProps } from '../../types/dashboard.types'

export const RevenueTrendWidget = ({ data }: DashboardWidgetProps) => {
  const series = data.trends?.revenue
  if (!series) return null
  const total = series.reduce((sum, p) => sum + (p.amount ?? 0), 0)

  return (
    <WidgetCard title={`Evoluție încasări (${series.length} zile)`} linkTo="/billing" linkLabel={formatCurrency(total)}>
      <TrendChart
        points={series.map((p) => ({ label: formatDayMonth(p.date), value: p.amount ?? 0 }))}
        ariaLabel={`Încasări pe zi în ultimele ${series.length} zile, total ${formatCurrency(total)}`}
        formatValue={formatCurrency}
      />
    </WidgetCard>
  )
}
