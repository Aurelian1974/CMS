import { useParams, useNavigate } from 'react-router-dom'
import { useAdministrativeStaffDetail } from '../hooks/useAdministrativeStaff'
import { formatDateTime } from '@/utils/format'
import { AppBadge } from '@/components/ui/AppBadge'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import styles from './AdministrativeStaffDetailPage.module.scss'

const IconBack = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="19" y1="12" x2="5" y2="12" />
    <polyline points="12 19 5 12 12 5" />
  </svg>
)

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

export const AdministrativeStaffDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: resp, isLoading, isError } = useAdministrativeStaffDetail(id ?? '')

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
        <div className="alert alert-danger m-4">Membrul personalului administrativ nu a fost găsit.</div>
      </div>
    )
  }

  const staff = resp.data

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.backBtn} onClick={() => navigate('/administrative-staff')}>
            <IconBack /> Înapoi la personal administrativ
          </button>
          <AppBadge variant={staff.isActive ? 'success' : 'neutral'} withDot>
            {staff.isActive ? 'Activ' : 'Inactiv'}
          </AppBadge>
        </div>

        <h1 className={styles.pageTitle}>{staff.fullName}</h1>
        <div className={styles.pageSubtitle}>
          {staff.positionName && <span>{staff.positionName}</span>}
          {staff.departmentName && <span>• {staff.departmentName}</span>}
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.section}>
          <p className={styles.sectionTitle}>Date personale și contact</p>
          <div className={styles.infoGrid}>
            <InfoRow label="Prenume" value={staff.firstName} />
            <InfoRow label="Nume"    value={staff.lastName} />
            <InfoRow label="Email"   value={staff.email} />
            <InfoRow label="Telefon" value={staff.phoneNumber} />
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Date profesionale</p>
          <div className={styles.infoGrid}>
            <InfoRow label="Funcție"     value={staff.positionName} />
            <InfoRow label="Departament" value={staff.departmentName} />
          </div>
        </div>

        <div className={styles.section}>
          <p className={styles.sectionTitle}>Audit</p>
          <div className={styles.infoGrid}>
            <InfoRow label="Creat la"          value={staff.createdAt ? formatDateTime(staff.createdAt) : null} />
            <InfoRow label="Ultima modificare" value={staff.updatedAt ? formatDateTime(staff.updatedAt) : null} />
            <InfoRow label="ID intern"         value={staff.id} mono fullWidth />
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdministrativeStaffDetailPage
