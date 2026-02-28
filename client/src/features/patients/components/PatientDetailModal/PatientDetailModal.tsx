import { useState, useEffect } from 'react'
import { usePatientDetail } from '../../hooks/usePatients'
import { formatDate, formatDateTime } from '@/utils/format'
import type { PatientDetailDto, PatientAllergyDto, PatientDoctorDto, PatientEmergencyContactDto } from '../../types/patient.types'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import type { ModalTab } from '@/components/ui/AppModal'
import styles from './PatientDetailModal.module.scss'

// ── Icoane SVG ────────────────────────────────────────────────────────────────
const IconPhone  = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
const IconMail   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>
const IconShield = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>

type DetailTab = 'personal' | 'contact' | 'medical' | 'doctors' | 'audit'

interface PatientDetailModalProps {
  isOpen: boolean
  onClose: () => void
  patientId: string | null
  /** Deschide modalul de editare pentru pacientul curent */
  onEdit?: () => void
}

const getInitials = (first?: string | null, last?: string | null) =>
  `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || '?'

const getSeverityClass = (code: string): string => {
  switch (code.toUpperCase()) {
    case 'ANAPHYLAXIS': return styles['severity--anaphylaxis']
    case 'SEVERE':      return styles['severity--severe']
    case 'MODERATE':    return styles['severity--moderate']
    case 'MILD':        return styles['severity--mild']
    default:            return ''
  }
}

export const PatientDetailModal = ({ isOpen, onClose, patientId, onEdit }: PatientDetailModalProps) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('personal')
  const { data: resp, isLoading, isError } = usePatientDetail(patientId ?? '', isOpen && !!patientId)

  // Reset tab la deschidere
  useEffect(() => {
    if (isOpen) setActiveTab('personal')
  }, [isOpen])

  const patient = resp?.data?.patient as PatientDetailDto | undefined
  const allergies = resp?.data?.allergies ?? []
  const doctors = resp?.data?.doctors ?? []
  const emergencyContacts = resp?.data?.emergencyContacts ?? []

  const hasData = !isLoading && !isError && !!patient

  // Tab-uri cu label dinamic pentru doctors count
  const tabs: ModalTab[] | undefined = hasData
    ? [
        { key: 'personal', label: 'Date personale' },
        { key: 'contact',  label: 'Contact & Adresă' },
        { key: 'medical',  label: 'Medical' },
        { key: 'doctors',  label: `Medici (${doctors.length})` },
        { key: 'audit',    label: 'Audit' },
      ]
    : undefined

  // Header custom cu gradient
  const headerContent = isLoading ? (
    <div className={styles.headerLoading}>
      <div className="d-flex justify-content-between align-items-start w-100">
        <div className={styles.headerPlaceholder} />
        <button type="button" className={styles.closeBtn} onClick={onClose}>&times;</button>
      </div>
    </div>
  ) : isError || !patient ? (
    <div className={styles.headerError}>
      <span>Pacientul nu a fost găsit.</span>
      <button type="button" className={styles.closeBtn} onClick={onClose}>&times;</button>
    </div>
  ) : (
    <div className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.patientHeader}>
          <div className={styles.avatar}>{getInitials(patient.firstName, patient.lastName)}</div>
          <div className={styles.patientInfo}>
            <h2 className={styles.patientName}>{patient.fullName}</h2>
            <div className={styles.patientMeta}>
              {patient.patientCode && <span className={styles.patientCode}>{patient.patientCode}</span>}
              {patient.age != null && <span>{patient.age} ani</span>}
              {patient.genderName && <span>{patient.genderName}</span>}
              <span>CNP: {patient.cnp}</span>
            </div>
            <div className={styles.quickInfo}>
              {patient.phoneNumber && <span><IconPhone /> {patient.phoneNumber}</span>}
              {patient.email && <span><IconMail /> {patient.email}</span>}
              {patient.isInsured && <span className={styles.insuredBadge}><IconShield /> Asigurat CNAS</span>}
            </div>
          </div>
        </div>

        <div className={styles.headerActions}>
          <span className={`${styles.statusBadge} ${styles[patient.isActive ? 'statusBadge--active' : 'statusBadge--inactive']}`}>
            {patient.isActive ? 'Activ' : 'Inactiv'}
          </span>
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
      maxWidth={900}
      header={headerContent}
      tabs={tabs}
      activeTab={activeTab}
      onTabChange={(key) => setActiveTab(key as DetailTab)}
      footer={footerContent}
    >
      {/* Loading */}
      {isLoading && (
        <div className={styles.bodyLoading}>
          <LoadingSpinner size="sm" />
          <span>Se încarcă datele pacientului...</span>
        </div>
      )}

      {/* Conținut tab-uri */}
      {hasData && (
        <>
          {activeTab === 'personal' && <PersonalTab patient={patient} />}
          {activeTab === 'contact'  && <ContactTab patient={patient} emergencyContacts={emergencyContacts} />}
          {activeTab === 'medical'  && <MedicalTab patient={patient} allergies={allergies} />}
          {activeTab === 'doctors'  && <DoctorsTab doctors={doctors} />}
          {activeTab === 'audit'    && <AuditTab patient={patient} />}
        </>
      )}
    </AppModal>
  )
}

// ═══════════ InfoRow ═══════════
const InfoRow = ({ label, value, mono, fullWidth }: { label: string; value: string; mono?: boolean; fullWidth?: boolean }) => (
  <div className={`${styles.infoRow} ${fullWidth ? styles.infoRowFull : ''}`}>
    <span className={styles.infoLabel}>{label}</span>
    <span className={`${styles.infoValue} ${mono ? styles.mono : ''}`}>{value}</span>
  </div>
)

// ═══════════ Tab 1: Date personale ═══════════
const PersonalTab = ({ patient }: { patient: PatientDetailDto }) => (
  <div className={styles.infoGrid}>
    <InfoRow label="Nume"            value={patient.lastName} />
    <InfoRow label="Prenume"         value={patient.firstName} />
    <InfoRow label="CNP"             value={patient.cnp} mono />
    <InfoRow label="Data nașterii"   value={patient.birthDate ? formatDate(patient.birthDate) : '—'} />
    <InfoRow label="Vârstă"         value={patient.age != null ? `${patient.age} ani` : '—'} />
    <InfoRow label="Gen"             value={patient.genderName ?? '—'} />
    <InfoRow label="Grupă sanguină" value={patient.bloodTypeName ?? '—'} />
    <InfoRow label="Cod pacient"     value={patient.patientCode ?? '—'} mono />
    {patient.notes && <InfoRow label="Note" value={patient.notes} fullWidth />}
  </div>
)

// ═══════════ Tab 2: Contact & Adresă ═══════════
const ContactTab = ({ patient, emergencyContacts }: { patient: PatientDetailDto; emergencyContacts: PatientEmergencyContactDto[] }) => (
  <div>
    <div className={styles.infoGrid}>
      <InfoRow label="Telefon principal" value={patient.phoneNumber ?? '—'} />
      <InfoRow label="Telefon secundar"  value={patient.secondaryPhone ?? '—'} />
      <InfoRow label="Email"             value={patient.email ?? '—'} />
      <InfoRow label="Adresă"           value={patient.address ?? '—'} fullWidth />
      <InfoRow label="Oraș"             value={patient.city ?? '—'} />
      <InfoRow label="Județ"           value={patient.county ?? '—'} />
      <InfoRow label="Cod poștal"       value={patient.postalCode ?? '—'} />
    </div>

    {emergencyContacts.length > 0 && (
      <div className={styles.subSection}>
        <h6 className={styles.subSectionTitle}>Contacte urgență ({emergencyContacts.length})</h6>
        <div className={styles.cardList}>
          {emergencyContacts.map(c => (
            <div key={c.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardName}>{c.fullName}</span>
                {c.isDefault && <span className={styles.primaryBadge}>Principal</span>}
              </div>
              <div className={styles.cardMeta}>
                <span><IconPhone /> {c.phoneNumber}</span>
                {c.relationship && <span>({c.relationship})</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
)

// ═══════════ Tab 3: Medical ═══════════
const MedicalTab = ({ patient, allergies }: { patient: PatientDetailDto; allergies: PatientAllergyDto[] }) => (
  <div>
    <div className={styles.infoGrid}>
      <InfoRow label="Grupă sanguină"   value={patient.bloodTypeName ?? '—'} />
      <InfoRow label="Medic de familie"  value={patient.familyDoctorName ?? '—'} />
      <InfoRow label="Total vizite"      value={String(patient.totalVisits)} />
      <InfoRow label="Asigurat CNAS"     value={patient.isInsured ? 'Da' : 'Nu'} />
      <InfoRow label="Nr. asigurare"     value={patient.insuranceNumber ?? '—'} mono />
      <InfoRow label="Asigurare expiră" value={patient.insuranceExpiry ? formatDate(patient.insuranceExpiry) : '—'} />
      {patient.chronicDiseases && <InfoRow label="Boli cronice" value={patient.chronicDiseases} fullWidth />}
    </div>

    <div className={styles.subSection}>
      <h6 className={styles.subSectionTitle}>Alergii ({allergies.length})</h6>
      {allergies.length === 0 ? (
        <p className={styles.emptyMsg}>Nicio alergie înregistrată.</p>
      ) : (
        <div className={styles.cardList}>
          {allergies.map(a => (
            <div key={a.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardName}>{a.allergenName}</span>
                <span className={`${styles.severityBadge} ${getSeverityClass(a.allergySeverityCode)}`}>
                  {a.allergySeverityName}
                </span>
              </div>
              <div className={styles.cardMeta}>
                <span>Tip: {a.allergyTypeName}</span>
                {a.reaction && <span>Reacție: {a.reaction}</span>}
                {a.onsetDate && <span>Debut: {formatDate(a.onsetDate)}</span>}
                {a.notes && <span>Note: {a.notes}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)

// ═══════════ Tab 4: Medici asociați ═══════════
const DoctorsTab = ({ doctors }: { doctors: PatientDoctorDto[] }) => {
  if (doctors.length === 0) {
    return <p className={styles.emptyMsg}>Niciun medic asociat.</p>
  }

  return (
    <div className={styles.cardList}>
      {doctors.map(d => (
        <div key={d.id} className={styles.card}>
          <div className={styles.cardHeader}>
            <span className={styles.cardName}>{d.doctorName}</span>
            {d.isPrimary && <span className={styles.primaryBadge}>Medic primar</span>}
          </div>
          <div className={styles.cardMeta}>
            {d.doctorSpecialtyName && <span>{d.doctorSpecialtyName}</span>}
            {d.doctorMedicalCode && <span>Parafă: {d.doctorMedicalCode}</span>}
            {d.doctorPhone && <span><IconPhone /> {d.doctorPhone}</span>}
            {d.doctorEmail && <span><IconMail /> {d.doctorEmail}</span>}
          </div>
          {d.assignedAt && (
            <div className={styles.cardFooter}>Asignat la: {formatDate(d.assignedAt)}</div>
          )}
        </div>
      ))}
    </div>
  )
}

// ═══════════ Tab 5: Audit ═══════════
const AuditTab = ({ patient }: { patient: PatientDetailDto }) => (
  <div className={styles.infoGrid}>
    <InfoRow label="Creat la"          value={formatDateTime(patient.createdAt)} />
    <InfoRow label="Creat de"          value={patient.createdByName ?? '—'} />
    <InfoRow label="Ultima modificare" value={patient.updatedAt ? formatDateTime(patient.updatedAt) : '—'} />
    <InfoRow label="Modificat de"      value={patient.updatedByName ?? '—'} />
    <InfoRow label="Cod pacient"       value={patient.patientCode ?? '—'} mono />
    <InfoRow label="ID intern"         value={patient.id} mono />
  </div>
)
