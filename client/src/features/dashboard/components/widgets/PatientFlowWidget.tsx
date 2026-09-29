import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock } from 'lucide-react'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import { useCanChangeAppointmentStatus } from '@/features/appointments/hooks/useCanChangeAppointmentStatus'
import { ConsultationBillingModal } from '@/features/billing/components/ConsultationBillingModal'
import { formatCurrency } from '@/utils/format'
import { WidgetCard } from '../WidgetCard'
import { AgendaStatusActions } from './AgendaStatusActions'
import { FLOW_DEFAULT_PRIORITY, FLOW_STAGE_ORDER, FLOW_STAGES, type FlowStage } from './patientFlow'
import { formatTime } from '../../utils/dashboardFormat'
import type { DashboardFlowItemDto, DashboardWidgetProps } from '../../types/dashboard.types'
import widgetStyles from './DashboardWidgets.module.scss'
import styles from './PatientFlowWidget.module.scss'

const AGENDA_WIDGET_ID = 'list.agenda.today'

const formatElapsed = (startedAt: string | null | undefined): string => {
  if (!startedAt) return ''
  const minutes = Math.max(0, Math.round((Date.now() - new Date(startedAt).getTime()) / 60_000))
  return minutes < 60 ? `de ${minutes} min` : `de ${Math.floor(minutes / 60)} h ${minutes % 60} min`
}

export const PatientFlowWidget = ({ data }: DashboardWidgetProps) => {
  const { canRead, canWrite } = useHasAccess()
  const canChangeStatus = useCanChangeAppointmentStatus()
  const [selected, setSelected] = useState<FlowStage | null>(null)
  const [statusError, setStatusError] = useState<string | null>(null)
  const [billingId, setBillingId] = useState<string | null>(null)
  const items = data.flow?.items
  if (!items) return null

  // Neconfirmații au deja lista lor de acțiuni când agenda e pe același dashboard
  const hideToConfirm = data.widgetIds?.includes(AGENDA_WIDGET_ID) ?? false
  const stages = FLOW_STAGE_ORDER.filter((s) => !(hideToConfirm && s.stage === FLOW_STAGES.ToConfirm))
  const visible = items.filter((i) => stages.some((s) => s.stage === i.stage))
  const countOf = (stage: FlowStage) => visible.filter((i) => i.stage === stage).length
  const active = selected
    ?? FLOW_DEFAULT_PRIORITY.find((s) => stages.some((x) => x.stage === s) && countOf(s) > 0)
    ?? stages[0].stage
  const rows = visible.filter((i) => i.stage === active)

  const canOpenConsultation = canRead(MODULE.Consultations)
  const canCollect = canWrite(MODULE.Payments)
  const linkOf = (i: DashboardFlowItemDto) =>
    i.consultationId && canOpenConsultation ? `/consultations/${i.consultationId}`
      : i.appointmentId ? `/appointments/${i.appointmentId}`
      : null

  return (
    <>
      <WidgetCard
        title="Fluxul pacienților azi"
        count={visible.length}
        linkTo="/appointments/scheduler"
        linkLabel="Calendar"
        isEmpty={visible.length === 0}
        emptyText="Niciun pacient azi."
      >
        <div className={styles.stages} role="group" aria-label="Etape">
          {stages.map((s) => (
            <button
              key={s.stage}
              type="button"
              className={`${styles.stage} ${styles[s.tone]} ${s.stage === active ? styles.active : ''}`}
              aria-pressed={s.stage === active}
              onClick={() => setSelected(s.stage)}
            >
              <span>{s.label}</span>
              <span className={styles.stageCount}>{countOf(s.stage)}</span>
            </button>
          ))}
        </div>

        {statusError && <div className="alert alert-danger py-2 mb-2" role="alert">{statusError}</div>}

        {rows.length === 0 ? (
          <p className={styles.emptyStage}>Niciun pacient în această etapă.</p>
        ) : (
          <ul className={widgetStyles.list}>
            {rows.map((i) => {
              const link = linkOf(i)
              const content = (
                <>
                  <span className={widgetStyles.time}>
                    <Clock size={15} aria-hidden />
                    {formatTime(i.time)}
                  </span>
                  <span className={widgetStyles.info}>
                    <span className={widgetStyles.primary}>{i.patientName}</span>
                    <span className={widgetStyles.secondary}>
                      {i.doctorName}
                      {i.stage === FLOW_STAGES.InConsultation && i.startedAt ? ` · ${formatElapsed(i.startedAt)}` : ''}
                    </span>
                  </span>
                </>
              )
              return (
                <li key={i.consultationId ?? i.appointmentId} className={widgetStyles.row}>
                  {link
                    ? <Link to={link} className={widgetStyles.rowLink}>{content}</Link>
                    : <span className={widgetStyles.rowLink}>{content}</span>}
                  {!i.appointmentId && <AppBadge variant="neutral">Fără programare</AppBadge>}
                  {i.amountDue != null && <span className={widgetStyles.amount}>{formatCurrency(i.amountDue)}</span>}
                  {i.stage === FLOW_STAGES.ToPay && canCollect && i.consultationId && (
                    <AppButton size="sm" onClick={() => setBillingId(i.consultationId ?? null)}>Încasează</AppButton>
                  )}
                  {canChangeStatus && i.appointmentId && !i.consultationId && (
                    <AgendaStatusActions
                      appointmentId={i.appointmentId}
                      patientName={i.patientName ?? ''}
                      statusCode={i.appointmentStatusCode ?? ''}
                      onError={setStatusError}
                    />
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </WidgetCard>
      <ConsultationBillingModal consultationId={billingId} onClose={() => setBillingId(null)} />
    </>
  )
}
