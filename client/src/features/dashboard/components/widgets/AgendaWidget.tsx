import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { AppBadge } from '@/components/ui/AppBadge'
import { WidgetCard } from '../WidgetCard'
import { APPOINTMENT_STATUS_VARIANT } from './statusVariants'
import { formatTime } from '../../utils/dashboardFormat'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

export const AgendaWidget = ({ data }: DashboardWidgetProps) => {
  const items = data.agenda?.appointments
  if (!items) return null

  return (
    <WidgetCard
      title="Agenda de azi"
      count={items.length}
      linkTo="/appointments/scheduler"
      linkLabel="Calendar"
      isEmpty={items.length === 0}
      emptyText="Nicio programare azi."
    >
      <ul className={styles.list}>
        {items.map((a) => (
          <li key={a.id}>
            <Link to={`/appointments/${a.id}`} className={styles.row}>
              <span className={styles.time}>
                <Clock size={15} aria-hidden />
                {formatTime(a.startTime)}
              </span>
              <span className={styles.info}>
                <span className={styles.primary}>{a.patientName}</span>
                <span className={styles.secondary}>
                  {a.doctorName}
                  {a.notes ? ` · ${a.notes}` : ''}
                </span>
              </span>
              <AppBadge variant={APPOINTMENT_STATUS_VARIANT[a.statusCode ?? ''] ?? 'neutral'} withDot>
                {a.statusName}
              </AppBadge>
            </Link>
          </li>
        ))}
      </ul>
    </WidgetCard>
  )
}
