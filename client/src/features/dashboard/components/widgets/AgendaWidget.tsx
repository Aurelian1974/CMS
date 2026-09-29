import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { AppBadge } from '@/components/ui/AppBadge'
import { useCanChangeAppointmentStatus } from '@/features/appointments/hooks/useCanChangeAppointmentStatus'
import { WidgetCard } from '../WidgetCard'
import { AgendaStatusSelect } from './AgendaStatusSelect'
import { APPOINTMENT_STATUS_VARIANT } from './statusVariants'
import { formatTime } from '../../utils/dashboardFormat'
import type { DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

export const AgendaWidget = ({ data }: DashboardWidgetProps) => {
  const canChangeStatus = useCanChangeAppointmentStatus()
  const [statusError, setStatusError] = useState<string | null>(null)
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
      {statusError && <div className="alert alert-danger py-2 mb-2" role="alert">{statusError}</div>}
      <ul className={styles.list}>
        {items.map((a) => {
          const badge = (
            <AppBadge variant={APPOINTMENT_STATUS_VARIANT[a.statusCode ?? ''] ?? 'neutral'} withDot>
              {a.statusName}
            </AppBadge>
          )
          return (
            <li key={a.id} className={styles.row}>
              <Link to={`/appointments/${a.id}`} className={styles.rowLink}>
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
              </Link>
              {/* Odată începută consultația, starea programării o conduce consultația */}
              {canChangeStatus && !a.consultationId ? (
                <AgendaStatusSelect
                  appointmentId={a.id ?? ''}
                  patientName={a.patientName ?? ''}
                  statusCode={a.statusCode ?? ''}
                  statusName={a.statusName ?? ''}
                  fallback={badge}
                  onError={setStatusError}
                />
              ) : badge}
            </li>
          )
        })}
      </ul>
    </WidgetCard>
  )
}
