import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppBadge } from '@/components/ui/AppBadge'
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import { useCanChangeAppointmentStatus } from '@/features/appointments/hooks/useCanChangeAppointmentStatus'
import { formatDate } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import { AgendaStatusActions } from './AgendaStatusActions'
import { ATTENTION_TYPE_META, ATTENTION_TYPES, type AttentionType } from './patientFlow'
import { formatTime } from '../../utils/dashboardFormat'
import type { DashboardAttentionItemDto, DashboardWidgetProps } from '../../types/dashboard.types'
import styles from './DashboardWidgets.module.scss'

const describe = (a: DashboardAttentionItemDto): string => {
  switch (a.type) {
    case ATTENTION_TYPES.StaleConsultation:
      return `începută ${formatDate(a.occurredAt!)} · deschisă de ${a.daysOpen} ${a.daysOpen === 1 ? 'zi' : 'zile'}`
    case ATTENTION_TYPES.UnresolvedAppointment:
      return `${formatDate(a.occurredAt!)} ${formatTime(a.occurredAt)} · ${a.statusName ?? ''}`
    default:
      return `azi, ${formatTime(a.occurredAt)} · neconfirmat`
  }
}

export const AttentionWidget = ({ data }: DashboardWidgetProps) => {
  const { canRead } = useHasAccess()
  const canChangeStatus = useCanChangeAppointmentStatus()
  const [statusError, setStatusError] = useState<string | null>(null)
  const items = data.flow?.attention
  if (!items) return null

  const canOpenConsultation = canRead(MODULE.Consultations)

  return (
    <WidgetCard
      title="Necesită atenție"
      count={items.length}
      isEmpty={items.length === 0}
      emptyText="Nimic de rezolvat."
    >
      {statusError && <div className="alert alert-danger py-2 mb-2" role="alert">{statusError}</div>}
      <ul className={styles.list}>
        {items.map((a) => {
          const meta = ATTENTION_TYPE_META[a.type as AttentionType]
          const link = a.consultationId && canOpenConsultation ? `/consultations/${a.consultationId}`
            : a.appointmentId ? `/appointments/${a.appointmentId}`
            : null
          const content = (
            <span className={styles.info}>
              <span className={styles.primary}>{a.patientName}</span>
              <span className={styles.secondary}>{a.doctorName} · {describe(a)}</span>
            </span>
          )
          return (
            <li key={`${a.type}-${a.consultationId ?? a.appointmentId}`} className={styles.row}>
              {meta && <AppBadge variant={meta.variant}>{meta.label}</AppBadge>}
              {link
                ? <Link to={link} className={styles.rowLink}>{content}</Link>
                : <span className={styles.rowLink}>{content}</span>}
              {canChangeStatus && a.appointmentId && !a.consultationId && (
                <AgendaStatusActions
                  appointmentId={a.appointmentId}
                  patientName={a.patientName ?? ''}
                  statusCode={a.statusCode ?? ''}
                  onError={setStatusError}
                />
              )}
            </li>
          )
        })}
      </ul>
    </WidgetCard>
  )
}
