import { ServiceLinesEditor } from '@/features/billing/components/ServiceLinesEditor'
import { useConsultationServiceMutations, useConsultationServices } from '@/features/billing/hooks/useBilling'

interface ConsultationServicesTabProps {
  consultationId: string
  statusCode: string | null
  canWrite: boolean
  onError: (message: string) => void
}

// Serviciile se mai pot corecta după finalizare, până la emiterea bonului / facturii (Consultation_* SP → 50601)
const SERVICES_EDITABLE_STATUSES = ['INLUCRU', 'FINALIZATA']

/** Tab-ul „Servicii" din fișa consultației: medicul consemnează serviciile efectuate. */
export const ConsultationServicesTab = ({ consultationId, statusCode, canWrite, onError }: ConsultationServicesTabProps) => {
  const { data: resp, isLoading } = useConsultationServices(consultationId)
  const { add, update, remove, sync } = useConsultationServiceMutations()

  const isOpen = SERVICES_EDITABLE_STATUSES.includes(statusCode?.toUpperCase() ?? '')
  const busy = add.isPending || update.isPending || remove.isPending || sync.isPending
  const fail = (err: unknown) => onError(err instanceof Error ? err.message : 'Operația nu a putut fi efectuată.')

  if (isLoading) return <p className="text-muted small mb-0">Se încarcă…</p>

  return (
    <ServiceLinesEditor
      lines={resp?.data?.lines ?? []}
      total={resp?.data?.total ?? 0}
      canEdit={canWrite && isOpen}
      busy={busy}
      readOnlyHint={isOpen ? undefined : statusCode?.toUpperCase() === 'FACTURATA'
        ? 'Consultația a fost facturată — serviciile nu mai pot fi modificate. Corecțiile se fac prin stornare.'
        : 'Consultația este blocată — serviciile nu mai pot fi modificate.'}
      onAdd={(medicalServiceId, quantity) => add.mutate({ consultationId, medicalServiceId, quantity }, { onError: fail })}
      onUpdateQuantity={(id, quantity) => update.mutate({ id, quantity }, { onError: fail })}
      onDelete={(id) => remove.mutate(id, { onError: fail })}
      unbilledInvestigations={resp?.data?.unbilledInvestigations ?? []}
      onSyncInvestigations={() => sync.mutate(consultationId, { onError: fail })}
    />
  )
}
