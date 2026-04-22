import { useConsultationDetail } from '../../hooks/useConsultations'
import { formatDate, formatDateTime } from '@/utils/format'
import type { ConsultationDetailDto } from '../../types/consultation.types'
import { AppModal } from '@/components/ui/AppModal'
import { AppBadge, type BadgeVariant } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import styles from './ConsultationDetailModal.module.scss'

const getStatusVariant = (code: string | null): BadgeVariant => {
  if (!code) return 'neutral'
  switch (code.toUpperCase()) {
    case 'INLUCRU':    return 'warning'
    case 'FINALIZATA': return 'success'
    case 'BLOCATA':    return 'neutral'
    default:           return 'neutral'
  }
}

interface ConsultationDetailModalProps {
  isOpen: boolean
  onClose: () => void
  consultationId: string | null
  onEdit?: () => void
}

export const ConsultationDetailModal = ({
  isOpen,
  onClose,
  consultationId,
  onEdit,
}: ConsultationDetailModalProps) => {
  const { data: resp, isLoading, isError } = useConsultationDetail(
    consultationId ?? '',
    isOpen && !!consultationId,
  )

  const consultation = resp?.data as ConsultationDetailDto | undefined
  const hasData = !isLoading && !isError && !!consultation
  const isLocked = consultation?.statusCode?.toUpperCase() === 'BLOCATA'

  const headerContent = isLoading ? (
    <div className={styles.headerLoading}>
      <span>Se încarcă...</span>
      <button type="button" className={styles.closeBtn} onClick={onClose}>&times;</button>
    </div>
  ) : isError || !consultation ? (
    <div className={styles.headerError}>
      <span>Consultația nu a fost găsită.</span>
      <button type="button" className={styles.closeBtn} onClick={onClose}>&times;</button>
    </div>
  ) : (
    <div className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.headerInfo}>
          <h2 className={styles.patientName}>{consultation.patientName}</h2>
          <div className={styles.headerMeta}>
            <span>{consultation.doctorName}</span>
            {consultation.specialtyName && <span>• {consultation.specialtyName}</span>}
            <span>• {formatDate(consultation.date)}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <AppBadge variant={getStatusVariant(consultation.statusCode)} withDot>
            {consultation.statusName}
          </AppBadge>
          {onEdit && !isLocked && (
            <button type="button" className={styles.editBtn} onClick={onEdit}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editează
            </button>
          )}
          <button type="button" className={styles.closeBtn} onClick={onClose}>&times;</button>
        </div>
      </div>
    </div>
  )

  const footerContent = (
    <AppButton variant="outline-secondary" size="sm" onClick={onClose}>
      Închide
    </AppButton>
  )

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={750}
      header={headerContent}
      footer={footerContent}
    >
      {isLoading && (
        <div className={styles.bodyLoading}>
          <LoadingSpinner size="sm" />
          <span>Se încarcă datele consultației...</span>
        </div>
      )}

      {hasData && (
        <>
          {isLocked && (
            <div className={styles.lockedNotice}>
              🔒 Consultație blocată — doar citire
            </div>
          )}

          {/* Informații pacient */}
          <div className={styles.infoGrid}>
            <InfoRow label="Pacient" value={consultation.patientName} />
            <InfoRow label="Telefon pacient" value={consultation.patientPhone ?? '—'} />
            <InfoRow label="CNP pacient" value={consultation.patientCnp ?? '—'} mono />
            <InfoRow label="Email pacient" value={consultation.patientEmail ?? '—'} />
          </div>

          {/* Detalii consultație */}
          <div className={styles.section}>
            <h6 className={styles.sectionTitle}>Detalii consultație</h6>
            <div className={styles.infoGrid}>
              <InfoRow label="Medic" value={consultation.doctorName} />
              <InfoRow label="Specialitate" value={consultation.specialtyName ?? '—'} />
              <InfoRow label="Cod parafă" value={consultation.doctorMedicalCode ?? '—'} mono />
              <InfoRow label="Data" value={formatDate(consultation.date)} />
            </div>
          </div>

          {/* Motiv prezentare */}
          {consultation.motiv && (
            <div className={styles.section}>
              <h6 className={styles.sectionTitle}>Motiv prezentare</h6>
              <p className={styles.textContent}>{consultation.motiv}</p>
            </div>
          )}

          {/* Examen clinic */}
          {consultation.examenClinic && (
            <div className={styles.section}>
              <h6 className={styles.sectionTitle}>Examen clinic</h6>
              <p className={styles.textContent}>{consultation.examenClinic}</p>
            </div>
          )}

          {/* Diagnostic */}
          {(consultation.diagnostic || consultation.diagnosticCodes) && (
            <div className={styles.section}>
              <h6 className={styles.sectionTitle}>Diagnostic</h6>
              {consultation.diagnostic && <p className={styles.textContent}>{consultation.diagnostic}</p>}
              {consultation.diagnosticCodes && (
                <div className={styles.diagTags}>
                  {consultation.diagnosticCodes.split(',').map((code, i) => (
                    <span key={i} className={styles.diagTag}>{code.trim()}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Recomandări */}
          {consultation.recomandari && (
            <div className={styles.section}>
              <h6 className={styles.sectionTitle}>Recomandări și tratament</h6>
              <p className={styles.textContent}>{consultation.recomandari}</p>
            </div>
          )}

          {/* Observații */}
          {consultation.observatii && (
            <div className={styles.section}>
              <h6 className={styles.sectionTitle}>Observații suplimentare</h6>
              <p className={styles.textContent}>{consultation.observatii}</p>
            </div>
          )}

          {/* Audit */}
          <div className={styles.section}>
            <h6 className={styles.sectionTitle}>Audit</h6>
            <div className={styles.infoGrid}>
              <InfoRow label="Creat la" value={consultation.createdAt ? formatDateTime(consultation.createdAt) : '—'} />
              <InfoRow label="Creat de" value={consultation.createdByName ?? '—'} />
              <InfoRow label="Ultima modificare" value={consultation.updatedAt ? formatDateTime(consultation.updatedAt) : '—'} />
              <InfoRow label="Modificat de" value={consultation.updatedByName ?? '—'} />
              <InfoRow label="ID intern" value={consultation.id} mono />
            </div>
          </div>
        </>
      )}
    </AppModal>
  )
}

const InfoRow = ({ label, value, mono, fullWidth }: { label: string; value: string; mono?: boolean; fullWidth?: boolean }) => (
  <div className={`${styles.infoRow} ${fullWidth ? styles.infoRowFull : ''}`}>
    <span className={styles.infoLabel}>{label}</span>
    <span className={`${styles.infoValue} ${mono ? styles.mono : ''}`}>{value}</span>
  </div>
)
