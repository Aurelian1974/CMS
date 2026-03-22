import { useAppointmentDetail } from '../../hooks/useAppointments'
import { formatDate, formatDateTime } from '@/utils/format'
import type { AppointmentDetailDto } from '../../types/appointment.types'
import { AppModal } from '@/components/ui/AppModal'
import { AppBadge, type BadgeVariant } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import styles from './AppointmentDetailModal.module.scss'

const getStatusVariant = (code: string | null): BadgeVariant => {
  if (!code) return 'neutral'
  switch (code.toUpperCase()) {
    case 'PROGRAMAT':    return 'primary'
    case 'CONFIRMAT':    return 'success'
    case 'FINALIZAT':    return 'neutral'
    case 'ANULAT':       return 'danger'
    case 'NEPREZENTARE': return 'warning'
    default:             return 'neutral'
  }
}

const formatTime = (dateStr: string): string => {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
}

interface AppointmentDetailModalProps {
  isOpen: boolean
  onClose: () => void
  appointmentId: string | null
  onEdit?: () => void
}

export const AppointmentDetailModal = ({
  isOpen,
  onClose,
  appointmentId,
  onEdit,
}: AppointmentDetailModalProps) => {
  const { data: resp, isLoading, isError } = useAppointmentDetail(
    appointmentId ?? '',
    isOpen && !!appointmentId,
  )

  const appointment = resp?.data as AppointmentDetailDto | undefined
  const hasData = !isLoading && !isError && !!appointment

  // Header custom
  const headerContent = isLoading ? (
    <div className={styles.headerLoading}>
      <span>Se încarcă...</span>
      <button type="button" className={styles.closeBtn} onClick={onClose}>&times;</button>
    </div>
  ) : isError || !appointment ? (
    <div className={styles.headerError}>
      <span>Programarea nu a fost găsită.</span>
      <button type="button" className={styles.closeBtn} onClick={onClose}>&times;</button>
    </div>
  ) : (
    <div className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.headerInfo}>
          <h2 className={styles.patientName}>{appointment.patientName}</h2>
          <div className={styles.headerMeta}>
            <span>{appointment.doctorName}</span>
            {appointment.specialtyName && <span>• {appointment.specialtyName}</span>}
            <span>• {formatDate(appointment.startTime)}</span>
            <span>{formatTime(appointment.startTime)} — {formatTime(appointment.endTime)}</span>
          </div>
        </div>
        <div className={styles.headerActions}>
          <AppBadge variant={getStatusVariant(appointment.statusCode)} withDot>
            {appointment.statusName}
          </AppBadge>
          {onEdit && (
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
      maxWidth={700}
      header={headerContent}
      footer={footerContent}
    >
      {isLoading && (
        <div className={styles.bodyLoading}>
          <LoadingSpinner size="sm" />
          <span>Se încarcă datele programării...</span>
        </div>
      )}

      {hasData && (
        <>
          {/* Informații programare */}
          <div className={styles.infoGrid}>
            <InfoRow label="Pacient" value={appointment.patientName} />
            <InfoRow label="Telefon pacient" value={appointment.patientPhone ?? '—'} />
            <InfoRow label="CNP pacient" value={appointment.patientCnp ?? '—'} mono />
            <InfoRow label="Email pacient" value={appointment.patientEmail ?? '—'} />
          </div>

          <div className={styles.section}>
            <h6 className={styles.sectionTitle}>Detalii programare</h6>
            <div className={styles.infoGrid}>
              <InfoRow label="Doctor" value={appointment.doctorName} />
              <InfoRow label="Specialitate" value={appointment.specialtyName ?? '—'} />
              <InfoRow label="Cod parafă" value={appointment.doctorMedicalCode ?? '—'} mono />
              <InfoRow label="Status" value={appointment.statusName} />
              <InfoRow label="Data" value={formatDate(appointment.startTime)} />
              <InfoRow label="Interval orar" value={`${formatTime(appointment.startTime)} — ${formatTime(appointment.endTime)}`} />
              {appointment.notes && (
                <InfoRow label="Observații" value={appointment.notes} fullWidth />
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h6 className={styles.sectionTitle}>Audit</h6>
            <div className={styles.infoGrid}>
              <InfoRow label="Creat la" value={appointment.createdAt ? formatDateTime(appointment.createdAt) : '—'} />
              <InfoRow label="Creat de" value={appointment.createdByName ?? '—'} />
              <InfoRow label="Ultima modificare" value={appointment.updatedAt ? formatDateTime(appointment.updatedAt) : '—'} />
              <InfoRow label="Modificat de" value={appointment.updatedByName ?? '—'} />
              <InfoRow label="ID intern" value={appointment.id} mono />
            </div>
          </div>
        </>
      )}
    </AppModal>
  )
}

// ── InfoRow helper ────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, mono, fullWidth }: { label: string; value: string; mono?: boolean; fullWidth?: boolean }) => (
  <div className={`${styles.infoRow} ${fullWidth ? styles.infoRowFull : ''}`}>
    <span className={styles.infoLabel}>{label}</span>
    <span className={`${styles.infoValue} ${mono ? styles.mono : ''}`}>{value}</span>
  </div>
)
