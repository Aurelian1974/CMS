import { useDoctorDetail } from '../../hooks/useDoctors'
import { formatDate } from '@/utils/format'
import { AppModal } from '@/components/ui/AppModal'
import styles from './DoctorViewModal.module.scss'

interface DoctorViewModalProps {
  /** Id-ul doctorului de vizualizat, null = modal închis */
  doctorId: string | null
  onClose: () => void
}

export const DoctorViewModal = ({ doctorId, onClose }: DoctorViewModalProps) => {
  const { data: resp, isLoading } = useDoctorDetail(doctorId ?? '')

  const doctor = resp?.data ?? null

  return (
    <AppModal
      isOpen={!!doctorId}
      onClose={onClose}
      maxWidth={580}
      title="Detalii Doctor"
      footer={
        <button className="btn btn-outline-secondary" onClick={onClose}>
          Închide
        </button>
      }
    >
      {isLoading ? (
        <div className={styles.loadingWrap}>
          <div className="spinner-border spinner-border-sm text-primary" role="status">
            <span className="visually-hidden">Se încarcă...</span>
          </div>
        </div>
      ) : !doctor ? (
        <div className="alert alert-warning mb-0">Doctorul nu a fost găsit.</div>
      ) : (
        <>
          {/* Nume + Status */}
          <div className={styles.nameRow}>
            <div>
              <h4 className={styles.doctorName}>{doctor.fullName}</h4>
              {doctor.specialtyName && (
                <span className={styles.specialty}>{doctor.specialtyName}</span>
              )}
              {doctor.subspecialtyName && (
                <span className={styles.subspecialty}> · {doctor.subspecialtyName}</span>
              )}
            </div>
            <span className={doctor.isActive ? styles.badgeActive : styles.badgeInactive}>
              {doctor.isActive ? 'Activ' : 'Inactiv'}
            </span>
          </div>

          {/* Grile info */}
          <div className={styles.infoGrid}>
            <InfoField label="Email" value={doctor.email} />
            <InfoField label="Telefon" value={doctor.phoneNumber} />
            <InfoField label="Titulatură" value={doctor.medicalTitleName} />
            <InfoField label="Parafă medicală" value={doctor.medicalCode} />
            <InfoField label="Nr. CMR" value={doctor.licenseNumber} />
            <InfoField
              label="Aviz CMR expiră"
              value={doctor.licenseExpiresAt ? formatDate(doctor.licenseExpiresAt) : null}
            />
            <InfoField label="Departament" value={doctor.departmentName} />
            <InfoField label="Șef ierarhic" value={doctor.supervisorName} />
            <InfoField
              label="Data înregistrării"
              value={formatDate(doctor.createdAt)}
            />
          </div>
        </>
      )}
    </AppModal>
  )
}

// ── Componentă helper pentru un câmp readonly ──
const InfoField = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className={styles.infoField}>
    <span className={styles.infoLabel}>{label}</span>
    <span className={styles.infoValue}>{value || '—'}</span>
  </div>
)
