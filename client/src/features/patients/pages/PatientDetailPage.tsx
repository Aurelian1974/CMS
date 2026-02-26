import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePatientDetail } from '../hooks/usePatients'
import { formatDate, formatDateTime } from '@/utils/format'
import type { PatientDetailDto, PatientAllergyDto, PatientDoctorDto, PatientEmergencyContactDto } from '../types/patient.types'
import styles from './PatientDetailPage.module.scss'

// ── Icoane SVG ────────────────────────────────────────────────────────────────
const IconBack   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
const IconEdit   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const IconPhone  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
const IconMail   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/></svg>
const IconShield = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>

type Tab = 'personal' | 'contact' | 'address' | 'medical' | 'insurance' | 'doctors' | 'audit'

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

export const PatientDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: resp, isLoading, isError } = usePatientDetail(id ?? '')
  const [activeTab, setActiveTab] = useState<Tab>('personal')

  if (isLoading) {
    return (
      <div className={styles.page}>
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 300 }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Se încarcă...</span>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !resp?.data) {
    return (
      <div className={styles.page}>
        <div className="alert alert-danger m-4">Pacientul nu a fost găsit.</div>
      </div>
    )
  }

  const { patient, allergies, doctors, emergencyContacts } = resp.data

  const tabs: { key: Tab; label: string }[] = [
    { key: 'personal',  label: 'Date Personale' },
    { key: 'contact',   label: 'Contact' },
    { key: 'address',   label: 'Adresă' },
    { key: 'medical',   label: 'Date Medicale' },
    { key: 'insurance', label: 'Asigurare' },
    { key: 'doctors',   label: `Doctori (${doctors.length})` },
    { key: 'audit',     label: 'Audit' },
  ]

  return (
    <div className={styles.page}>

      {/* Header cu gradient */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button className={styles.backBtn} onClick={() => navigate('/patients')}>
            <IconBack /> Înapoi la pacienți
          </button>
          <div className={styles.headerActions}>
            <span className={`${styles.statusBadge} ${styles[patient.isActive ? 'statusBadge--active' : 'statusBadge--inactive']}`}>
              {patient.isActive ? 'Activ' : 'Inactiv'}
            </span>
            <button className={styles.btnPrimary} onClick={() => navigate(`/patients`)}>
              <IconEdit /> Editează
            </button>
          </div>
        </div>

        <div className={styles.patientHeader}>
          <div className={styles.avatar}>{getInitials(patient.firstName, patient.lastName)}</div>
          <div className={styles.patientInfo}>
            <h1 className={styles.pageTitle}>{patient.fullName}</h1>
            <div className={styles.pageSubtitle}>
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
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={styles.content}>
        {activeTab === 'personal'  && <PersonalTab patient={patient} />}
        {activeTab === 'contact'   && <ContactTab patient={patient} emergencyContacts={emergencyContacts} />}
        {activeTab === 'address'   && <AddressTab patient={patient} />}
        {activeTab === 'medical'   && <MedicalTab patient={patient} allergies={allergies} />}
        {activeTab === 'insurance' && <InsuranceTab patient={patient} />}
        {activeTab === 'doctors'   && <DoctorsTab doctors={doctors} />}
        {activeTab === 'audit'     && <AuditTab patient={patient} />}
      </div>
    </div>
  )
}

// ═══════════ Componenta reutilizabilă InfoRow ═══════════
const InfoRow = ({ label, value, mono, fullWidth }: { label: string; value: string; mono?: boolean; fullWidth?: boolean }) => (
  <div className={`${styles.infoRow} ${fullWidth ? styles.infoRowFull : ''}`}>
    <span className={styles.infoLabel}>{label}</span>
    <span className={`${styles.infoValue} ${mono ? styles.mono : ''}`}>{value}</span>
  </div>
)

// ═══════════ Tab 1: Date Personale ═══════════
const PersonalTab = ({ patient }: { patient: PatientDetailDto }) => (
  <div className={styles.infoGrid}>
    <InfoRow label="Nume"              value={patient.lastName} />
    <InfoRow label="Prenume"           value={patient.firstName} />
    <InfoRow label="CNP"               value={patient.cnp} mono />
    <InfoRow label="Data nașterii"     value={patient.birthDate ? formatDate(patient.birthDate) : '—'} />
    <InfoRow label="Vârstă"           value={patient.age != null ? `${patient.age} ani` : '—'} />
    <InfoRow label="Gen"               value={patient.genderName ?? '—'} />
    <InfoRow label="Grupă sanguină"   value={patient.bloodTypeName ?? '—'} />
    <InfoRow label="Cod pacient"       value={patient.patientCode ?? '—'} mono />
    {patient.notes && <InfoRow label="Note" value={patient.notes} fullWidth />}
  </div>
)

// ═══════════ Tab 2: Contact ═══════════
const ContactTab = ({ patient, emergencyContacts }: { patient: PatientDetailDto; emergencyContacts: PatientEmergencyContactDto[] }) => (
  <div>
    <div className={styles.infoGrid}>
      <InfoRow label="Telefon principal"   value={patient.phoneNumber ?? '—'} />
      <InfoRow label="Telefon secundar"    value={patient.secondaryPhone ?? '—'} />
      <InfoRow label="Email"               value={patient.email ?? '—'} />
    </div>

    {/* Contacte urgență */}
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

// ═══════════ Tab 3: Adresă ═══════════
const AddressTab = ({ patient }: { patient: PatientDetailDto }) => (
  <div className={styles.infoGrid}>
    <InfoRow label="Adresă"     value={patient.address ?? '—'} fullWidth />
    <InfoRow label="Oraș"       value={patient.city ?? '—'} />
    <InfoRow label="Județ"     value={patient.county ?? '—'} />
    <InfoRow label="Cod poștal" value={patient.postalCode ?? '—'} />
  </div>
)

// ═══════════ Tab 4: Date Medicale ═══════════
const MedicalTab = ({ patient, allergies }: { patient: PatientDetailDto; allergies: PatientAllergyDto[] }) => (
  <div>
    <div className={styles.infoGrid}>
      <InfoRow label="Grupă sanguină"     value={patient.bloodTypeName ?? '—'} />
      <InfoRow label="Medic de familie"    value={patient.familyDoctorName ?? '—'} />
      <InfoRow label="Total vizite"        value={String(patient.totalVisits)} />
      {patient.chronicDiseases && <InfoRow label="Boli cronice" value={patient.chronicDiseases} fullWidth />}
    </div>

    {/* Alergii */}
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

// ═══════════ Tab 5: Asigurare ═══════════
const InsuranceTab = ({ patient }: { patient: PatientDetailDto }) => {
  const isExpired = patient.insuranceExpiry
    ? new Date(patient.insuranceExpiry) < new Date()
    : false

  return (
    <div className={styles.infoGrid}>
      <InfoRow label="Asigurat CNAS"       value={patient.isInsured ? 'Da' : 'Nu'} />
      <InfoRow label="Nr. asigurare"       value={patient.insuranceNumber ?? '—'} mono />
      <InfoRow label="Data expirare"       value={patient.insuranceExpiry ? formatDate(patient.insuranceExpiry) : '—'} />
      {isExpired && (
        <div className={styles.infoRow}>
          <span className={styles.infoLabel}>Status</span>
          <span className={styles.expiredBadge}>Expirat</span>
        </div>
      )}
    </div>
  )
}

// ═══════════ Tab 6: Doctori asociați ═══════════
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

// ═══════════ Tab 7: Audit ═══════════
const AuditTab = ({ patient }: { patient: PatientDetailDto }) => (
  <div className={styles.infoGrid}>
    <InfoRow label="Creat la"             value={formatDateTime(patient.createdAt)} />
    <InfoRow label="Creat de"             value={patient.createdByName ?? '—'} />
    <InfoRow label="Ultima modificare"    value={patient.updatedAt ? formatDateTime(patient.updatedAt) : '—'} />
    <InfoRow label="Modificat de"         value={patient.updatedByName ?? '—'} />
    <InfoRow label="Cod pacient"          value={patient.patientCode ?? '—'} mono />
    <InfoRow label="ID intern"            value={patient.id} mono />
  </div>
)

export default PatientDetailPage
