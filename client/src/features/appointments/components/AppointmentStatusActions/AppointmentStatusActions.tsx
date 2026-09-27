import { useState } from 'react'
import { AppButton, type ButtonVariant } from '@/components/ui/AppButton'
import { useAppointmentStatuses, useUpdateAppointmentStatus } from '../../hooks/useAppointments'

interface AppointmentStatusActionsProps {
  appointmentId: string
  currentStatusCode: string
  canWrite: boolean
  onSuccess: (message: string) => void
  onError: (message: string) => void
}

interface QuickAction {
  code: string
  label: string
  variant: ButtonVariant
}

/** Acțiunile rapide, în ordinea fluxului clinic; apar doar cele permise de matricea de tranziții. */
const QUICK_ACTIONS: QuickAction[] = [
  { code: 'CONFIRMAT',    label: 'Confirmă',     variant: 'outline-primary' },
  { code: 'FINALIZAT',    label: 'Finalizează',  variant: 'primary' },
  { code: 'NEPREZENTARE', label: 'Neprezentare', variant: 'outline-secondary' },
  { code: 'ANULAT',       label: 'Anulează',     variant: 'outline-danger' },
  { code: 'PROGRAMAT',    label: 'Reactivează',  variant: 'outline-primary' },
]

export const AppointmentStatusActions = ({
  appointmentId, currentStatusCode, canWrite, onSuccess, onError,
}: AppointmentStatusActionsProps) => {
  const { data: statusesResp } = useAppointmentStatuses()
  const updateStatus = useUpdateAppointmentStatus()
  const [pendingCode, setPendingCode] = useState<string | null>(null)

  const statuses = statusesResp?.data ?? []
  const current = statuses.find(s => s.code === currentStatusCode)
  const allowed = new Set((current?.allowedNextCodes ?? '').split(',').filter(Boolean))

  if (!canWrite || allowed.size === 0) return null

  return (
    <div className="d-flex flex-wrap gap-2 me-auto">
      {QUICK_ACTIONS.filter(a => allowed.has(a.code)).map(action => {
        const target = statuses.find(s => s.code === action.code)
        if (!target) return null
        const label = action.code === 'PROGRAMAT' && currentStatusCode === 'CONFIRMAT'
          ? 'Retrage confirmarea'
          : action.label
        return (
          <AppButton
            key={action.code}
            size="sm"
            variant={action.variant}
            isLoading={pendingCode === action.code}
            disabled={updateStatus.isPending}
            onClick={() => {
              setPendingCode(action.code)
              updateStatus.mutate(
                { id: appointmentId, statusId: target.id },
                {
                  onSuccess: () => onSuccess(`Status actualizat: ${target.name}.`),
                  onError: (err: Error) => onError(err.message),
                  onSettled: () => setPendingCode(null),
                },
              )
            }}
          >
            {label}
          </AppButton>
        )
      })}
    </div>
  )
}
