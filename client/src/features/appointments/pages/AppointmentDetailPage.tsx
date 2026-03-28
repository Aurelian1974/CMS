import { useParams, useNavigate } from 'react-router-dom'
import { useAppointmentDetail } from '../hooks/useAppointments'
import { formatDate, formatDateTime } from '@/utils/format'
import type { AppointmentDetailDto } from '../types/appointment.types'
import { AppBadge, type BadgeVariant } from '@/components/ui/AppBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import styles from './AppointmentDetailPage.module.scss'

// ── Helpers ───────────────────────────────────────────────────────────────────
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

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

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })

// ── Sub-component ─────────────────────────────────────────────────────────────
const InfoRow = ({
  label,
  value,
  mono,
  fullWidth,
}: {
  label: string
  value: string | null | undefined
  mono?: boolean
  fullWidth?: boolean
}) => (
  <div className={`${styles.infoRow} ${fullWidth ? styles.infoRowFull : ''}`}>
    <span className={styles.infoLabel}>{label}</span>
    <span className={`${styles.infoValue}${mono ? ` ${styles.mono}` : ''}`}>
      {value || '—'}
    </span>
  </div>
)

// ── Page ──────────────────────────────────────────────────────────────────────
export const AppointmentDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: resp, isLoading, isError } = useAppointmentDetail(id ?? '')

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (isError || !resp?.data) {
    return (
      <div className={styles.page}>
        <div className="alert alert-danger m-4">Programarea nu a fost găsită.</div>
      </div>
    )
  }

  const appt = resp.data as AppointmentDetailDto

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.backBtn} onClick={() => navigate('/appointments')}>
            <IconBack /> Înapoi la programări
          </button>
          <div className={styles.headerActions}>
            <AppBadge variant={getStatusVariant(appt.statusCode)} withDot>
              {appt.statusName}
            </AppBadge>
          </div>
        </div>

        <h1 className={styles.pageTitle}>{appt.patientName}</h1>
        <div className={styles.pageSubtitle}>
          <span>{appt.doctorName}</span>
          {appt.specialtyName && <span>• {appt.specialtyName}</span>}
          <span>• {formatDate(appt.startTime)}</span>
          <span>{formatTime(appt.startTime)} — {formatTime(appt.endTime)}</span>
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Informații pacient */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Pacient</p>
          <div className={styles.infoGrid}>
            <InfoRow label="Nume" value={appt.patientName} />
            <InfoRow label="Telefon" value={appt.patientPhone} />
            <InfoRow label="CNP" value={appt.patientCnp} mono />
            <InfoRow label="Email" value={appt.patientEmail} />
          </div>
        </div>

        {/* Detalii programare */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Detalii programare</p>
          <div className={styles.infoGrid}>
            <InfoRow label="Doctor" value={appt.doctorName} />
            <InfoRow label="Specialitate" value={appt.specialtyName} />
            <InfoRow label="Cod parafă" value={appt.doctorMedicalCode} mono />
            <InfoRow label="Status" value={appt.statusName} />
            <InfoRow label="Data" value={formatDate(appt.startTime)} />
            <InfoRow label="Interval orar" value={`${formatTime(appt.startTime)} — ${formatTime(appt.endTime)}`} />
            {appt.notes && <InfoRow label="Observații" value={appt.notes} fullWidth />}
          </div>
        </div>

        {/* Audit */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Audit</p>
          <div className={styles.infoGrid}>
            <InfoRow label="Creat la"         value={appt.createdAt ? formatDateTime(appt.createdAt) : null} />
            <InfoRow label="Creat de"         value={appt.createdByName} />
            <InfoRow label="Ultima modificare" value={appt.updatedAt ? formatDateTime(appt.updatedAt) : null} />
            <InfoRow label="Modificat de"     value={appt.updatedByName} />
            <InfoRow label="ID intern"        value={appt.id} mono fullWidth />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AppointmentDetailPage
