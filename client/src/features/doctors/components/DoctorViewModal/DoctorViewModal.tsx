import { useDoctorDetail } from '../../hooks/useDoctors'
import { formatDate } from '@/utils/format'
import styles from './DoctorViewModal.module.scss'

interface DoctorViewModalProps {
  /** Id-ul doctorului de vizualizat, null = modal închis */
  doctorId: string | null
  onClose: () => void
}

export const DoctorViewModal = ({ doctorId, onClose }: DoctorViewModalProps) => {
  const { data: resp, isLoading } = useDoctorDetail(doctorId ?? '')

  if (!doctorId) return null

  const doctor = resp?.data ?? null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h5 className={styles.modalTitle}>Detalii Doctor</h5>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Închide">
            ×
          </button>
        </div>

        <div className={styles.modalBody}>
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
        </div>

        <div className={styles.modalFooter}>
          <button className="btn btn-outline-secondary" onClick={onClose}>
            Închide
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Componentă helper pentru un câmp readonly ──
const InfoField = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <div className={styles.infoField}>
    <span className={styles.infoLabel}>{label}</span>
    <span className={styles.infoValue}>{value || '—'}</span>
  </div>
)
