import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { AppBadge } from '@/components/ui/AppBadge'
import { useCanChangeAppointmentStatus } from '@/features/appointments/hooks/useCanChangeAppointmentStatus'
import { WidgetCard } from '../WidgetCard'
import { AgendaStatusSelect } from './AgendaStatusSelect'
import { APPOINTMENT_STATUS_VARIANT } from './statusVariants'
import { formatTime } from '../../utils/dashboardFormat'
import type { DashboardAgendaItemDto, DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

interface DoctorGroup {
  doctorId: string
  doctorName: string
  items: DashboardAgendaItemDto[]
}

/** Ordinea orară venită de pe server se păstrează în fiecare grup; grupurile se sortează după medic. */
const groupByDoctor = (items: DashboardAgendaItemDto[]): DoctorGroup[] => {
  const groups = new Map<string, DoctorGroup>()
  for (const item of items) {
    const key = item.doctorId ?? ''
    const group = groups.get(key) ?? { doctorId: key, doctorName: item.doctorName ?? '', items: [] }
    group.items.push(item)
    groups.set(key, group)
  }
  return [...groups.values()].sort((a, b) => a.doctorName.localeCompare(b.doctorName, 'ro'))
}

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
      <div className={styles.groups}>
        {groupByDoctor(items).map((group) => (
          <section key={group.doctorId} aria-label={`Programări ${group.doctorName}`}>
            <h6 className={styles.groupTitle}>
              <span>{group.doctorName}</span>
              <span className={styles.groupCount}>{group.items.length}</span>
            </h6>
            <ul className={styles.list}>
              {group.items.map((a) => {
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
                        {a.notes && <span className={styles.secondary}>{a.notes}</span>}
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
          </section>
        ))}
      </div>
    </WidgetCard>
  )
}
