import { useState } from 'react'
import { AppButton } from '@/components/ui/AppButton'
import { AppBadge } from '@/components/ui/AppBadge'
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import {
  useConsultationPrescriptions,
  useGenerateConsultationPrescriptions,
  usePrescriptionLookups,
} from '../../hooks/usePrescriptions'
import { PRESCRIPTION_STATUS, type PrescriptionDetailDto, type PrescriptionListDto } from '../../types/prescription.types'
import { formatSeriesNumber, statusBadgeVariant } from '../../utils/prescriptionFormat'
import { PrescriptionPreviewModal } from '../PrescriptionPreviewModal'
import { PrescriptionFormModal } from '../PrescriptionFormModal'
import styles from './ConsultationPrescriptionsPanel.module.scss'

interface ConsultationPrescriptionsPanelProps {
  consultationId: string
  isEditable: boolean
  /** Seriile rețetelor emise (neanulate) — pentru câmpurile consultației folosite de scrisoarea medicală */
  onIssuedSeriesChange?: (series: string | null) => void
}

const issuedSeries = (rows: PrescriptionListDto[]) => {
  const series = rows
    .filter((r) => r.number != null && r.statusCode !== PRESCRIPTION_STATUS.Cancelled)
    .map((r) => formatSeriesNumber(r.series, r.number))
  return series.length > 0 ? series.join(', ') : null
}

/**
 * Rețetele consultației: generarea din tratamentul recomandat separă automat
 * medicamentele compensate (rețetă compensată CNAS) de cele necompensate (rețetă simplă).
 */
export const ConsultationPrescriptionsPanel = ({
  consultationId,
  isEditable,
  onIssuedSeriesChange,
}: ConsultationPrescriptionsPanelProps) => {
  const { canRead, canWrite } = useHasAccess()
  const canView = canRead(MODULE.Prescriptions)
  const canGenerate = isEditable && canWrite(MODULE.Prescriptions)

  const [careTypeId, setCareTypeId] = useState('')
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [editing, setEditing] = useState<PrescriptionDetailDto | null>(null)
  const [message, setMessage] = useState<{ kind: 'success' | 'danger'; text: string } | null>(null)

  const { data: lookupsResp } = usePrescriptionLookups()
  const { data: listResp, refetch } = useConsultationPrescriptions(canView ? consultationId : '')
  const generateMut = useGenerateConsultationPrescriptions()

  const rows = listResp?.data ?? []
  const careTypes = lookupsResp?.data?.careTypes ?? []

  if (!canView) return null

  const handleGenerate = () => {
    setMessage(null)
    generateMut.mutate(
      { consultationId, careTypeId: careTypeId || null, insuredCategoryId: null, treatmentDays: null },
      {
        onSuccess: (resp) => {
          const count = resp.data?.length ?? 0
          setMessage({
            kind: 'success',
            text: count === 1
              ? 'A fost generată 1 rețetă (ciornă). Deschide-o pentru verificare și emitere.'
              : `Au fost generate ${count} rețete (ciornă), separate pe compensat / necompensat.`,
          })
        },
        onError: (err) => setMessage({ kind: 'danger', text: err.message }),
      },
    )
  }

  const handleChanged = async () => {
    const { data } = await refetch()
    onIssuedSeriesChange?.(issuedSeries(data?.data ?? []))
  }

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <h4 className={styles.title}>Rețete ({rows.length})</h4>
        {canGenerate && (
          <>
            <select
              className={`form-select form-select-sm ${styles.select}`}
              value={careTypeId}
              onChange={(e) => setCareTypeId(e.target.value)}
              aria-label="Tip afecțiune"
            >
              <option value="">Tip afecțiune…</option>
              {careTypes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <AppButton size="sm" variant="primary" onClick={handleGenerate}
              isLoading={generateMut.isPending} loadingText="Se generează...">
              Generează rețete
            </AppButton>
          </>
        )}
      </div>
      {canGenerate && (
        <p className={styles.hint}>
          Medicamentele compensate ajung pe rețetă compensată, cele necompensate pe rețetă simplă.
          Medicamentele deja prescrise nu se dublează.
        </p>
      )}

      {message && <div className={`alert alert-${message.kind} py-2 mt-2 mb-0 small`}>{message.text}</div>}

      {rows.length > 0 && (
        <ul className={styles.list}>
          {rows.map((r) => (
            <li key={r.id}>
              <div
                className={styles.item}
                role="button"
                tabIndex={0}
                onClick={() => setPreviewId(r.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setPreviewId(r.id)
                  }
                }}
              >
                <span className={styles.number}>{r.number == null ? '—' : formatSeriesNumber(r.series, r.number)}</span>
                <AppBadge variant={r.isCnas ? 'primary' : 'neutral'}>{r.isCnas ? 'Compensată' : 'Simplă'}</AppBadge>
                <AppBadge variant={statusBadgeVariant(r.statusCode)} withDot>{r.statusName}</AppBadge>
                {r.nhpCode && <AppBadge variant="purple">PNS {r.nhpCode}</AppBadge>}
                {r.isExpired && <AppBadge variant="danger">Expirată</AppBadge>}
                <span className={styles.meta}>
                  {r.itemCount} {r.itemCount === 1 ? 'medicament' : 'medicamente'}
                  {r.careTypeName ? ` · ${r.careTypeName}` : ''}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      <PrescriptionPreviewModal
        prescriptionId={previewId}
        onClose={() => setPreviewId(null)}
        onEdit={(detail) => { setPreviewId(null); setEditing(detail) }}
        onChanged={() => { void handleChanged() }}
      />

      <PrescriptionFormModal
        isOpen={!!editing}
        editData={editing}
        onClose={() => setEditing(null)}
        onSaved={(text) => setMessage({ kind: 'success', text })}
      />
    </div>
  )
}
