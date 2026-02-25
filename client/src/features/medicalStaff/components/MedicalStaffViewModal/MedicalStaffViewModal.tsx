import { useMedicalStaffDetail } from '../../hooks/useMedicalStaff'
import { formatDate } from '@/utils/format'
import styles from './MedicalStaffViewModal.module.scss'

interface MedicalStaffViewModalProps {
  /** Id-ul membrului de vizualizat, null = modal închis */
  staffId: string | null
  onClose: () => void
}

export const MedicalStaffViewModal = ({ staffId, onClose }: MedicalStaffViewModalProps) => {
  const { data: resp, isLoading } = useMedicalStaffDetail(staffId ?? '')

  if (!staffId) return null

  const staff = resp?.data ?? null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h5 className={styles.modalTitle}>Detalii Personal Medical</h5>
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
          ) : !staff ? (
            <div className="alert alert-warning mb-0">Membrul personalului medical nu a fost găsit.</div>
          ) : (
            <>
              {/* Nume + Status */}
              <div className={styles.nameRow}>
                <div>
                  <h4 className={styles.staffName}>{staff.fullName}</h4>
                  {staff.medicalTitleName && (
                    <span className={styles.titleBadge}>{staff.medicalTitleName}</span>
                  )}
                </div>
                <span className={staff.isActive ? styles.badgeActive : styles.badgeInactive}>
                  {staff.isActive ? 'Activ' : 'Inactiv'}
                </span>
              </div>

              {/* Grile info */}
              <div className={styles.infoGrid}>
                <InfoField label="Email" value={staff.email} />
                <InfoField label="Telefon" value={staff.phoneNumber} />
                <InfoField label="Titulatură" value={staff.medicalTitleName} />
                <InfoField label="Departament" value={staff.departmentName} />
                <InfoField label="Doctor supervizor" value={staff.supervisorName} />
                <InfoField
                  label="Data înregistrării"
                  value={formatDate(staff.createdAt)}
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
