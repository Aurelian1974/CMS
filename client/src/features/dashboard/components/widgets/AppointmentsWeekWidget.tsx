import { WidgetCard } from '../WidgetCard'
import { TrendChart } from '../TrendChart'
import { formatDayMonth } from '../../utils/dashboardFormat'
import type { DashboardWidgetProps } from '../../types/dashboard.types'

const WEEK = 7

export const AppointmentsWeekWidget = ({ data }: DashboardWidgetProps) => {
  const series = data.trends?.appointments
  if (!series) return null
  const week = series.slice(-WEEK)
  const total = week.reduce((sum, p) => sum + (p.totalCount ?? 0), 0)

  return (
    <WidgetCard title="Programări (ultimele 7 zile)" count={total} linkTo="/appointments">
      <TrendChart
        variant="bar"
        points={week.map((p) => ({ label: formatDayMonth(p.date), value: p.totalCount ?? 0 }))}
        ariaLabel={`Programări pe zi în ultimele 7 zile, total ${total}`}
      />
    </WidgetCard>
  )
}
