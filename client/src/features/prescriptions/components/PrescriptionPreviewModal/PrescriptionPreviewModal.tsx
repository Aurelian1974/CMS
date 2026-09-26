import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { AppBadge } from '@/components/ui/AppBadge'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import { formatDate, formatDateTime } from '@/utils/format'
import {
  useCancelPrescription,
  useDeletePrescription,
  useIssuePrescription,
  usePrescription,
  usePrescriptionPdf,
  useTransmitPrescription,
} from '../../hooks/usePrescriptions'
import { PRESCRIPTION_STATUS, type PrescriptionDetailDto } from '../../types/prescription.types'
import { formatDose, formatPosology, formatSeriesNumber, statusBadgeVariant } from '../../utils/prescriptionFormat'
import { CancelPrescriptionDialog } from '../CancelPrescriptionDialog'
import styles from './PrescriptionPreviewModal.module.scss'

type PreviewTab = 'details' | 'pdf'

const TABS = [
  { key: 'details', label: 'Detalii' },
  { key: 'pdf', label: 'Document PDF' },
]

export type PrescriptionAction = 'issued' | 'cancelled' | 'deleted' | 'transmitted'

interface PrescriptionPreviewModalProps {
  /** null = modal închis */
  prescriptionId: string | null
  onClose: () => void
  onEdit: (prescription: PrescriptionDetailDto) => void
  onChanged?: (action: PrescriptionAction) => void
}

export const PrescriptionPreviewModal = ({ prescriptionId, ...rest }: PrescriptionPreviewModalProps) => {
  if (!prescriptionId) return null
  // Portal: modalul poate fi deschis din formularul consultației (butoanele nu trebuie să-l trimită).
  // key: la schimbarea rețetei starea internă (tab, erori) pornește de la zero.
  return createPortal(<PreviewContent key={prescriptionId} prescriptionId={prescriptionId} {...rest} />, document.body)
}

interface PreviewContentProps extends Omit<PrescriptionPreviewModalProps, 'prescriptionId'> {
  prescriptionId: string
}

const PreviewContent = ({ prescriptionId, onClose, onEdit, onChanged }: PreviewContentProps) => {
  const [tab, setTab] = useState<PreviewTab>('details')
  const [cancelOpen, setCancelOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  const { canWrite } = useHasAccess()
  const canModify = canWrite(MODULE.Prescriptions)

  const { data: resp, isLoading, isError } = usePrescription(prescriptionId)
  const detail = resp?.data ?? null

  const issueMut    = useIssuePrescription()
  const transmitMut = useTransmitPrescription()
  const cancelMut   = useCancelPrescription()
  const deleteMut   = useDeletePrescription()
  const isBusy = issueMut.isPending || transmitMut.isPending || cancelMut.isPending || deleteMut.isPending

  const pdfQuery = usePrescriptionPdf(detail?.id ?? null, detail?.updatedAt ?? null, tab === 'pdf')
  const pdfUrl = useMemo(() => (pdfQuery.data ? URL.createObjectURL(pdfQuery.data) : null), [pdfQuery.data])
  useEffect(() => () => { if (pdfUrl) URL.revokeObjectURL(pdfUrl) }, [pdfUrl])

  const label = detail ? formatSeriesNumber(detail.series, detail.number) : ''
  const status = detail?.statusCode

  const run = (mutate: () => Promise<unknown>, action: PrescriptionAction, closeAfter = false) => {
    setActionError(null)
    mutate()
      .then(() => {
        onChanged?.(action)
        if (closeAfter) onClose()
      })
      .catch((err: unknown) => setActionError(err instanceof Error ? err.message : 'A apărut o eroare neașteptată.'))
  }

  const handleIssue    = () => run(() => issueMut.mutateAsync(prescriptionId), 'issued')
  const handleTransmit = () => run(() => transmitMut.mutateAsync(prescriptionId), 'transmitted')
  const handleCancel   = (reason: string) => {
    setCancelOpen(false)
    run(() => cancelMut.mutateAsync({ id: prescriptionId, reason }), 'cancelled')
  }
  const handleDelete = () => {
    setDeleteOpen(false)
    run(() => deleteMut.mutateAsync(prescriptionId), 'deleted', true)
  }

  const title = detail
    ? `${detail.isCnas ? 'Rețetă compensată' : 'Rețetă simplă'} — ${label}`
    : 'Rețetă'

  const footer = (
    <div className={styles.footer}>
      {detail && canModify && status === PRESCRIPTION_STATUS.Draft && (
        <>
          <AppButton variant="outline-danger" size="sm" onClick={() => setDeleteOpen(true)} disabled={isBusy}>
            Șterge ciorna
          </AppButton>
          <AppButton variant="outline-primary" size="sm" onClick={() => onEdit(detail)} disabled={isBusy}>
            Editează
          </AppButton>
        </>
      )}
      {detail && canModify && (status === PRESCRIPTION_STATUS.Issued || status === PRESCRIPTION_STATUS.Transmitted) && (
        <AppButton variant="outline-danger" size="sm" onClick={() => setCancelOpen(true)} disabled={isBusy}>
          Anulează rețeta
        </AppButton>
      )}
      <span className={styles.footerSpacer} />
      {pdfUrl && tab === 'pdf' && (
        <a className="btn btn-sm btn-outline-secondary" href={pdfUrl} download={`reteta_${label.replace(/\s+/g, '')}.pdf`}>
          Descarcă PDF
        </a>
      )}
      {detail && canModify && detail.isCnas && status === PRESCRIPTION_STATUS.Issued && (
        <AppButton variant="outline-primary" size="sm" onClick={handleTransmit} isLoading={transmitMut.isPending}
          loadingText="Se transmite...">
          Transmite în SIPE
        </AppButton>
      )}
      {detail && canModify && status === PRESCRIPTION_STATUS.Draft && (
        <AppButton variant="primary" size="sm" onClick={handleIssue} isLoading={issueMut.isPending} loadingText="Se emite...">
          Emite rețeta
        </AppButton>
      )}
      <AppButton variant="outline-secondary" size="sm" onClick={onClose}>
        Închide
      </AppButton>
    </div>
  )

  return (
    <>
      <AppModal
        isOpen
        onClose={onClose}
        maxWidth={980}
        title={title}
        tabs={TABS}
        activeTab={tab}
        onTabChange={(k) => setTab(k as PreviewTab)}
        footer={footer}
        bodyClassName={styles.body}
      >
        {actionError && <div className="alert alert-danger py-2 mb-0">{actionError}</div>}

        {isLoading && <LoadingSpinner />}
        {isError && <div className="alert alert-danger mb-0">Rețeta nu a putut fi încărcată.</div>}

        {detail && tab === 'details' && <PrescriptionDetails detail={detail} />}

        {detail && tab === 'pdf' && (
          pdfQuery.isError
            ? <div className="alert alert-danger mb-0">Documentul PDF nu a putut fi generat.</div>
            : pdfUrl
              ? <iframe className={styles.pdfFrame} src={pdfUrl} title={`Rețeta ${label}`} />
              : <div className={styles.placeholder}>Se generează documentul…</div>
        )}
      </AppModal>

      <CancelPrescriptionDialog
        label={cancelOpen ? label : null}
        isLoading={cancelMut.isPending}
        onCancel={() => setCancelOpen(false)}
        onConfirm={handleCancel}
      />

      <ConfirmDeleteDialog
        name={deleteOpen ? `ciorna rețetei ${detail?.isCnas ? 'compensate' : 'simple'}` : null}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={handleDelete}
        isLoading={deleteMut.isPending}
      />
    </>
  )
}

// ── Detalii (antet + medicamente) ────────────────────────────────────────────
const Info = ({ label, value, meta, className }: { label: string; value: React.ReactNode; meta?: React.ReactNode; className?: string }) => (
  <div className={styles.infoCard}>
    <div className={styles.infoLabel}>{label}</div>
    <div className={`${styles.infoValue} ${className ?? ''}`}>{value || '—'}</div>
    {meta && <div className={styles.infoMeta}>{meta}</div>}
  </div>
)

const PrescriptionDetails = ({ detail }: { detail: PrescriptionDetailDto }) => (
  <>
    <div className={styles.headerRow}>
      <AppBadge variant={detail.isCnas ? 'primary' : 'neutral'}>{detail.typeName}</AppBadge>
      <AppBadge variant={statusBadgeVariant(detail.statusCode)} withDot>{detail.statusName}</AppBadge>
      {detail.isExpired && <AppBadge variant="danger">Expirată</AppBadge>}
      {detail.nhpCode && <AppBadge variant="purple">PNS {detail.nhpCode}</AppBadge>}
    </div>

    <div className={styles.infoGrid}>
      <Info label="Pacient" value={detail.patientName}
        meta={[detail.patientCnp && `CNP ${detail.patientCnp}`, detail.patientBirthDate && formatDate(detail.patientBirthDate)].filter(Boolean).join(' · ')} />
      <Info label="Medic" value={`Dr. ${detail.doctorName}`}
        meta={[detail.doctorSpecialty, detail.doctorMedicalCode && `parafă ${detail.doctorMedicalCode}`].filter(Boolean).join(' · ')} />
      <Info label="Diagnostic" value={detail.diagnostic} meta={detail.diagnosticCodes} />
      <Info label="Tip afecțiune" value={detail.careTypeName}
        meta={detail.treatmentDays ? `${detail.treatmentDays} zile tratament` : null} />
      {detail.isCnas && (
        <>
          <Info label="Categoria de asigurat" value={detail.insuredCategoryName}
            meta={detail.patientIsInsured ? 'Asigurat' : 'Neasigurat (verificați calitatea de asigurat)'} />
          <Info label="Tratament" value={detail.isContinuation ? 'Continuare' : 'Inițiere'}
            meta={detail.isContinuation && detail.referralLetterNumber ? `Scrisoare medicală nr. ${detail.referralLetterNumber}` : null} />
          {detail.nhpCode && <Info label="Program național" value={detail.nhpName ?? detail.nhpCode} />}
        </>
      )}
      {!detail.isCnas && <Info label="Nr. registru consultații" value={detail.registryNumber} />}
      <Info label="Emisă" value={detail.issueDate ? formatDateTime(detail.issueDate) : 'Neemisă (ciornă)'}
        meta={detail.consultationDate ? `Consultație din ${formatDate(detail.consultationDate)}` : null} />
      <Info label="Valabilă până la" value={detail.validUntil ? formatDate(detail.validUntil) : null}
        className={detail.isExpired ? styles.expired : undefined} />
      {detail.isCnas && (
        <Info label="SIPE" value={detail.electronicId ?? 'Netransmisă'}
          meta={detail.transmissionError
            ? `Ultima eroare: ${detail.transmissionError}`
            : detail.transmittedAt ? `Transmisă ${formatDateTime(detail.transmittedAt)}${detail.isOffline ? ' (offline)' : ''}` : null} />
      )}
      {detail.statusCode === PRESCRIPTION_STATUS.Cancelled && (
        <Info label="Anulată" value={detail.cancelReason}
          meta={detail.cancelledAt ? formatDateTime(detail.cancelledAt) : null} className={styles.expired} />
      )}
      {detail.notes && <Info label="Observații" value={detail.notes} />}
    </div>

    <h6 className={styles.sectionTitle}>Medicamente ({detail.items.length})</h6>
    <div className={styles.tableWrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Medicament</th>
            {detail.isCnas && <th>Listă</th>}
            {detail.isCnas && <th>%</th>}
            {detail.isCnas && <th>Cod diag.</th>}
            <th>D.S. (mod de administrare)</th>
            <th>Cantitate</th>
            {!detail.isCnas && <th>Regim</th>}
          </tr>
        </thead>
        <tbody>
          {detail.items.map((item, idx) => (
            <tr key={item.id}>
              <td>{idx + 1}</td>
              <td>
                <div className={styles.drugName}>{item.activeSubstance && detail.isCnas ? item.activeSubstance : item.drugName}</div>
                <div className={styles.drugMeta}>
                  {[detail.isCnas && item.activeSubstance ? item.drugName : null, item.pharmaceuticalForm, item.concentration]
                    .filter(Boolean).join(' · ')}
                </div>
              </td>
              {detail.isCnas && <td>{item.copaymentListType ?? '—'}</td>}
              {detail.isCnas && <td>{item.copaymentPercent != null ? `${formatDose(item.copaymentPercent)}%` : '—'}</td>}
              {detail.isCnas && <td>{item.diagnosisCode ?? '—'}</td>}
              <td>{formatPosology(item)}</td>
              <td>{item.quantity != null ? formatDose(item.quantity) : '—'}</td>
              {!detail.isCnas && <td>{item.prescriptionMode ?? '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
)
