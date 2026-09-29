import { useEffect, useState } from 'react'
import { Check, RotateCcw, UserX, X, type LucideIcon } from 'lucide-react'
import { useAppointmentStatuses, useUpdateAppointmentStatus } from '@/features/appointments/hooks/useAppointments'
import styles from './AgendaStatusActions.module.scss'

type Tone = 'success' | 'primary' | 'danger' | 'warning' | 'neutral'

interface ActionDef {
  label: string
  icon: LucideIcon
  tone: Tone
  iconOnly: boolean
  /** Acțiunile care scot pacientul din agendă cer un al doilea click */
  confirm: boolean
}

const ARM_TIMEOUT_MS = 4000

/** Aspectul unei acțiuni după starea țintă; ce acțiuni apar decide matricea de tranziții de pe server. */
const actionFor = (targetCode: string, currentCode: string): ActionDef | null => {
  switch (targetCode) {
    case 'CONFIRMAT':
      return { label: 'Confirmă', icon: Check, tone: 'success', iconOnly: false, confirm: false }
    case 'PROGRAMAT':
      return currentCode === 'CONFIRMAT'
        ? { label: 'Retrage confirmarea', icon: RotateCcw, tone: 'neutral', iconOnly: true, confirm: false }
        : { label: 'Reactivează', icon: RotateCcw, tone: 'primary', iconOnly: false, confirm: false }
    case 'ANULAT':
      return { label: 'Anulează', icon: X, tone: 'danger', iconOnly: true, confirm: true }
    case 'NEPREZENTARE':
      return { label: 'Neprezentare', icon: UserX, tone: 'warning', iconOnly: true, confirm: true }
    default:
      return null
  }
}

interface AgendaStatusActionsProps {
  appointmentId: string
  patientName: string
  statusCode: string
  onError: (message: string | null) => void
}

export const AgendaStatusActions = ({ appointmentId, patientName, statusCode, onError }: AgendaStatusActionsProps) => {
  const { data: statusesResp } = useAppointmentStatuses()
  const updateStatus = useUpdateAppointmentStatus()
  const [armedCode, setArmedCode] = useState<string | null>(null)

  useEffect(() => {
    if (!armedCode) return
    const timer = setTimeout(() => setArmedCode(null), ARM_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [armedCode])

  const statuses = statusesResp?.data ?? []
  const current = statuses.find((s) => s.code === statusCode)
  const allowed = new Set((current?.allowedNextCodes ?? '').split(',').filter(Boolean))
  const actions = statuses
    .filter((s) => allowed.has(s.code))
    .map((s) => ({ target: s, def: actionFor(s.code, statusCode) }))
    .filter((a): a is { target: typeof a.target; def: ActionDef } => a.def !== null)
    .sort((a, b) => Number(a.def.iconOnly) - Number(b.def.iconOnly))

  if (actions.length === 0) return null

  const run = (targetId: string) => {
    setArmedCode(null)
    onError(null)
    updateStatus.mutate(
      { id: appointmentId, statusId: targetId },
      { onError: (err: Error) => onError(err.message) },
    )
  }

  return (
    <div className={styles.actions}>
      {actions.map(({ target, def }) => {
        const Icon = def.icon
        const isArmed = armedCode === target.code
        const showText = !def.iconOnly || isArmed
        return (
          <button
            key={target.code}
            type="button"
            className={[
              styles.action,
              styles[def.tone],
              showText ? styles.pill : styles.round,
              isArmed ? styles.armed : '',
            ].join(' ')}
            title={def.label}
            aria-label={`${isArmed ? 'Sigur? ' : ''}${def.label} ${patientName}`}
            disabled={updateStatus.isPending}
            onClick={() => (def.confirm && !isArmed ? setArmedCode(target.code) : run(target.id))}
          >
            <Icon size={14} strokeWidth={2.5} aria-hidden />
            {showText && <span>{isArmed ? 'Sigur?' : def.label}</span>}
          </button>
        )
      })}
    </div>
  )
}
