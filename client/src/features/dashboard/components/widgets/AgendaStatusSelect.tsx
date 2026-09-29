import type { ReactNode } from 'react'
import { useAppointmentStatuses, useUpdateAppointmentStatus } from '@/features/appointments/hooks/useAppointments'
import styles from './DashboardWidgets.module.scss'

interface AgendaStatusSelectProps {
  appointmentId: string
  patientName: string
  statusCode: string
  statusName: string
  /** Afișat când din starea curentă nu există tranziții (ex. terminală) */
  fallback: ReactNode
  onError: (message: string | null) => void
}

/** Schimbare rapidă a stării din agendă; opțiunile vin din matricea de tranziții de pe server. */
export const AgendaStatusSelect = ({
  appointmentId, patientName, statusCode, statusName, fallback, onError,
}: AgendaStatusSelectProps) => {
  const { data: statusesResp } = useAppointmentStatuses()
  const updateStatus = useUpdateAppointmentStatus()

  const statuses = statusesResp?.data ?? []
  const current = statuses.find((s) => s.code === statusCode)
  const allowed = new Set((current?.allowedNextCodes ?? '').split(',').filter(Boolean))
  const targets = statuses.filter((s) => allowed.has(s.code))

  if (targets.length === 0) return <>{fallback}</>

  const handleChange = (code: string) => {
    const target = targets.find((s) => s.code === code)
    if (!target) return
    onError(null)
    updateStatus.mutate(
      { id: appointmentId, statusId: target.id },
      { onError: (err: Error) => onError(err.message) },
    )
  }

  return (
    <select
      className={`form-select form-select-sm ${styles.statusSelect}`}
      aria-label={`Stare programare ${patientName}`}
      value={statusCode}
      disabled={updateStatus.isPending}
      onChange={(e) => handleChange(e.target.value)}
    >
      <option value={statusCode}>{statusName}</option>
      {targets.map((s) => (
        <option key={s.id} value={s.code}>{s.name}</option>
      ))}
    </select>
  )
}
