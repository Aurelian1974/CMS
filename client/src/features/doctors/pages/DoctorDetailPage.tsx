import { useParams, useNavigate } from 'react-router-dom'
import { useDoctorDetail } from '../hooks/useDoctors'
import { formatDate, formatDateTime } from '@/utils/format'
import type { DoctorDetailDto } from '../types/doctor.types'
import { AppBadge } from '@/components/ui/AppBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import styles from './DoctorDetailPage.module.scss'

// ── Helpers ───────────────────────────────────────────────────────────────────
const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

const isExpiringSoon = (dateStr: string | null): boolean => {
  if (!dateStr) return false
  const expiresAt = new Date(dateStr)
  const in90Days = new Date()
  in90Days.setDate(in90Days.getDate() + 90)
  return expiresAt <= in90Days
}

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
export const DoctorDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: resp, isLoading, isError } = useDoctorDetail(id ?? '')

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
        <div className="alert alert-danger m-4">Medicul nu a fost găsit.</div>
      </div>
    )
  }

  const doctor = resp.data as DoctorDetailDto
  const licenseWarning = isExpiringSoon(doctor.licenseExpiresAt)

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.backBtn} onClick={() => navigate('/doctors')}>
            <IconBack /> Înapoi la medici
          </button>
          <div className={styles.headerActions}>
            <AppBadge variant={doctor.isActive ? 'success' : 'neutral'} withDot>
              {doctor.isActive ? 'Activ' : 'Inactiv'}
            </AppBadge>
          </div>
        </div>

        <h1 className={styles.pageTitle}>{doctor.fullName}</h1>
        <div className={styles.pageSubtitle}>
          {doctor.specialtyName && <span>{doctor.specialtyName}</span>}
          {doctor.medicalTitleName && <span>• {doctor.medicalTitleName}</span>}
          {doctor.departmentName && <span>• {doctor.departmentName}</span>}
          {licenseWarning && (
            <span className={styles.licenseWarning}>⚠ Aviz CMR expiră curând</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className={styles.content}>
        {/* Date personale */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Date personale și contact</p>
          <div className={styles.infoGrid}>
            <InfoRow label="Prenume"   value={doctor.firstName} />
            <InfoRow label="Nume"      value={doctor.lastName} />
            <InfoRow label="Email"     value={doctor.email} />
            <InfoRow label="Telefon"   value={doctor.phoneNumber} />
          </div>
        </div>

        {/* Date profesionale */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Date profesionale</p>
          <div className={styles.infoGrid}>
            <InfoRow label="Specialitate"     value={doctor.specialtyName} />
            <InfoRow label="Subspecialitate"  value={doctor.subspecialtyName} />
            <InfoRow label="Titlu medical"    value={doctor.medicalTitleName} />
            <InfoRow label="Departament"      value={doctor.departmentName} />
            <InfoRow label="Medic supervizor" value={doctor.supervisorName} />
            <InfoRow label="Cod parafă"       value={doctor.medicalCode} mono />
            <InfoRow label="Nr. CMR"          value={doctor.licenseNumber} mono />
            <InfoRow
              label="Aviz CMR valabil până"
              value={doctor.licenseExpiresAt ? formatDate(doctor.licenseExpiresAt) : null}
            />
          </div>
        </div>

        {/* Audit */}
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Audit</p>
          <div className={styles.infoGrid}>
            <InfoRow label="Creat la"          value={doctor.createdAt ? formatDateTime(doctor.createdAt) : null} />
            <InfoRow label="Ultima modificare" value={doctor.updatedAt ? formatDateTime(doctor.updatedAt) : null} />
            <InfoRow label="ID intern"         value={doctor.id} mono fullWidth />
          </div>
        </div>
      </div>
    </div>
  )
}

export default DoctorDetailPage
