import type { ReactNode } from 'react'
import styles from './MedicalLetter.module.scss'

// ─── Spirometry structured-data shape ────────────────────────────────────────
interface SpirometryFields {
  fvc?: number | null
  fvc_Predicted?: number | null
  fev1?: number | null
  fev1_FVC_Ratio?: number | null
  fev1_Predicted?: number | null
  pef?: number | null
  notes?: string | null
}

// ─── Lab analyses types (from AnalysesResults / AnalysesResultDetails) ───────
export interface LabAnalysesDetailRow {
  id: string
  section: string
  testName: string
  value: string
  unit: string | null
  referenceRange: string | null
  flag: string | null   // null=normal, 'HIGH', 'LOW', 'CHECK'
}

export interface LabAnalysesBulletin {
  id: string
  laboratory: string | null
  bulletinNumber: string | null
  collectionDate: string   // 'YYYY-MM-DD'
  details: LabAnalysesDetailRow[]
}

// ─── Public Props ─────────────────────────────────────────────────────────────
export interface MedicalLetterProps {
  provider: {
    name: string
    doctorName: string
    contractNumber: string
    contractDate?: string
    cas?: string
  }
  patient: {
    name: string
    birthDate: string
    cnp: string
  }
  consultation: {
    date: string
    registryNumber?: string
    isOncological: boolean
  }
  diagnoses: Array<{
    icdCode: string
    description: string
    detailNotes?: string
    isPrimary: boolean
  }>
  anamnesis?: string
  clinicalExam?: { general?: string; local?: string }
  labExams?: { normalValues?: string; pathologicalValues?: string }
  analysesResults?: LabAnalysesBulletin[]
  paraclinicTypes?: string[]
  investigations: Array<{
    type: string
    /** Display name shown in the block title. Falls back to `type`. */
    displayName?: string
    structuredData?: Record<string, unknown> | null
    narrative?: string | null
  }>
  treatmentAdministered?: string
  additionalInfo?: string
  recommendedTreatment?: string
  checkboxes: {
    returnForHospitalization: boolean
    prescriptionIssued: 'issued' | 'not_needed' | 'not_issued'
    medicalLeaveIssued: 'issued' | 'not_needed' | 'not_issued'
    homeCarePrescription: boolean
    medicalDevicePrescription: boolean
  }
  transmission: 'through_patient' | 'by_mail'
  issueDate: string
  doctorSignature: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const DASH = '—'

function dash(v: string | null | undefined): string {
  return v?.trim() || DASH
}

// ─── Small shared pieces ─────────────────────────────────────────────────────
function SecLabel({ children }: { children: ReactNode }) {
  return <div className={styles.secLabel}>{children}</div>
}

// ─── Spirometry metric grid ───────────────────────────────────────────────────
function SpirometryCards({ data }: { data: Record<string, unknown> }) {
  const s = data as SpirometryFields

  return (
    <div className={styles.metricGrid}>
      <div className={styles.metricCard}>
        <div className={styles.metricName}>FVC</div>
        <div className={styles.metricVal}>
          {s.fvc != null ? s.fvc : DASH}
          {s.fvc != null && <span className={styles.metricUnit}> L</span>}
        </div>
        {s.fvc_Predicted != null && (
          <div className={styles.metricSub}>Prezis {s.fvc_Predicted}%</div>
        )}
      </div>

      <div className={styles.metricCard}>
        <div className={styles.metricName}>FEV1</div>
        <div className={styles.metricVal}>
          {s.fev1 != null ? s.fev1 : DASH}
          {s.fev1 != null && <span className={styles.metricUnit}> L</span>}
        </div>
        {s.fev1_Predicted != null && (
          <div className={styles.metricSub}>Prezis {s.fev1_Predicted}%</div>
        )}
      </div>

      <div className={styles.metricCard}>
        <div className={styles.metricName}>FEV1/FVC</div>
        <div className={styles.metricVal}>
          {s.fev1_FVC_Ratio != null ? s.fev1_FVC_Ratio : DASH}
          {s.fev1_FVC_Ratio != null && <span className={styles.metricUnit}> %</span>}
        </div>
      </div>

      <div className={styles.metricCard}>
        <div className={styles.metricName}>PEF</div>
        <div className={styles.metricVal}>
          {s.pef != null ? s.pef : DASH}
          {s.pef != null && <span className={styles.metricUnit}> L/s</span>}
        </div>
      </div>

      <div className={`${styles.metricCard} ${styles.metricCardSecondary}`}>
        <div className={styles.metricName}>Obs. structurate</div>
        <div className={styles.metricNotes}>{s.notes || DASH}</div>
      </div>
    </div>
  )
}

// ─── Single investigation block ───────────────────────────────────────────────
function InvestigationBlock({
  inv,
}: {
  inv: MedicalLetterProps['investigations'][number]
}) {
  const title = inv.displayName ?? inv.type
  const hasStructured = inv.structuredData != null

  return (
    <div className={styles.investBlock}>
      <div className={`${styles.investTitle} ${hasStructured ? styles.investTitleBrand : ''}`}>
        {title}
      </div>

      {hasStructured && <SpirometryCards data={inv.structuredData!} />}

      {inv.narrative ? (
        hasStructured ? (
          // Both present: render narrative in a labelled sub-block below the metric grid
          <div className={styles.narrativeBlock}>
            <div className={styles.noteLabel}>Note clinice</div>
            <div className={styles.noteText}>{inv.narrative}</div>
          </div>
        ) : (
          // Narrative only
          <div className={styles.noteText}>{inv.narrative}</div>
        )
      ) : (
        !hasStructured && <div className={styles.noteMuted}>{DASH}</div>
      )}
    </div>
  )
}

// ─── Lab analyses block ───────────────────────────────────────────────────────
function FlagBadge({ flag }: { flag: string }) {
  if (flag === 'HIGH') return <span className={styles.labFlagHigh}>H</span>
  if (flag === 'LOW')  return <span className={styles.labFlagLow}>L</span>
  return <span className={styles.labFlagCheck}>!</span>
}

function LabTestRow({ row }: { row: LabAnalysesDetailRow }) {
  return (
    <div className={styles.labTestRow}>
      <span className={styles.labTestName} title={row.testName}>{row.testName}</span>
      <span className={styles.labTestValue}>{row.value}</span>
      {row.unit && <span className={styles.labTestUnit}>{row.unit}</span>}
      {row.referenceRange && (
        <span className={styles.labTestRef}>({row.referenceRange})</span>
      )}
      {row.flag && <FlagBadge flag={row.flag} />}
    </div>
  )
}

function LabBulletinBlock({ bulletin }: { bulletin: LabAnalysesBulletin }) {
  const normalRows = bulletin.details.filter(d => !d.flag)
  const pathoRows  = bulletin.details.filter(d => !!d.flag)

  const title = [
    bulletin.laboratory,
    bulletin.bulletinNumber ? `#${bulletin.bulletinNumber}` : null,
    bulletin.collectionDate,
  ].filter(Boolean).join(' — ')

  return (
    <div className={styles.labBulletin}>
      <div className={styles.labBulletinTitle}>{title}</div>
      <div className={styles.labColumns}>
        <div className={styles.labColNormal}>
          <div className={styles.labColLabelNormal}>Cu valori normale</div>
          {normalRows.length > 0
            ? normalRows.map(r => <LabTestRow key={r.id} row={r} />)
            : <div className={styles.labEmptyCol}>{DASH}</div>}
        </div>
        <div className={styles.labColPatho}>
          <div className={styles.labColLabelPatho}>Cu valori modificate</div>
          {pathoRows.length > 0
            ? pathoRows.map(r => <LabTestRow key={r.id} row={r} />)
            : <div className={styles.labEmptyCol}>{DASH}</div>}
        </div>
      </div>
    </div>
  )
}

// ─── Checkbox label helpers ───────────────────────────────────────────────────
function resolveCheckboxLabels(cb: MedicalLetterProps['checkboxes']) {
  const returnHosp = cb.returnForHospitalization
    ? '☑ Da, revine pentru internare'
    : '☑ Nu este necesară revenirea pentru internare'

  const prescription =
    cb.prescriptionIssued === 'issued'
      ? '☑ S-a eliberat prescripție medicală'
      : cb.prescriptionIssued === 'not_needed'
        ? '☑ Nu s-a eliberat prescripție medicală deoarece nu a fost necesar'
        : '☑ Nu s-a eliberat prescripție medicală'

  const leave =
    cb.medicalLeaveIssued === 'issued'
      ? '☑ S-a eliberat concediu medical la externare'
      : cb.medicalLeaveIssued === 'not_needed'
        ? '☑ Nu s-a eliberat concediu medical la externare deoarece nu a fost necesar'
        : '☑ Nu s-a eliberat concediu medical la externare'

  const homeCare = cb.homeCarePrescription
    ? '☑ S-a eliberat recomandare pentru îngrijiri la domiciliu'
    : '☑ Nu s-a eliberat recomandare pentru îngrijiri la domiciliu'

  const devices = cb.medicalDevicePrescription
    ? '☑ S-a eliberat prescripție pentru dispozitive medicale'
    : '☑ Nu s-a eliberat prescripție pentru dispozitive medicale'

  return { returnHosp, prescription, leave, homeCare, devices }
}

// ─── Main component ───────────────────────────────────────────────────────────
export const MedicalLetter = ({
  provider,
  patient,
  consultation,
  diagnoses,
  anamnesis,
  clinicalExam,
  labExams,
  analysesResults = [],
  paraclinicTypes = [],
  investigations,
  treatmentAdministered,
  additionalInfo,
  recommendedTreatment,
  checkboxes,
  transmission,
  issueDate,
  doctorSignature,
}: MedicalLetterProps) => {
  const cb = resolveCheckboxLabels(checkboxes)

  return (
    <div className={styles.wrapper}>

      {/* ── 1+2. Header + Title bar — atomic unit ─────────────────────────── */}
      <div className={styles.atomic}>
        <div className={styles.header}>
          <div>
            <div className={styles.furnizorLabel}>Furnizor</div>
            <div className={styles.clinicName}>{provider.name}</div>
            <div className={styles.headerDoctor}>
              Medic: <span className={styles.strong}>{provider.doctorName}</span>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.muted}>Contract/convenție</div>
            <div className={styles.strong}>
              nr. {provider.contractNumber}{provider.contractDate ? ` / ${provider.contractDate}` : ''}
            </div>
            <div className={`${styles.muted} ${styles.mt3}`}>CAS</div>
            {provider.cas && <div>{provider.cas}</div>}
          </div>
        </div>
        <div className={styles.titleBar}>SCRISOARE MEDICALĂ</div>
      </div>

      {/* ── 3. Collegial greeting — atomic ───────────────────────────────── */}
      <div className={styles.atomic}>
        <div className={styles.greeting}>
          Stimate(ă) coleg(ă), vă informăm că{' '}
          <span className={styles.highlight}>{patient.name}</span>, născut la data de{' '}
          <span className={styles.highlight}>{patient.birthDate}</span>,{' '}
          CNP/cod unic de asigurare{' '}
          <span className={styles.highlight}>{patient.cnp}</span>,{' '}
          a fost consultat în serviciul nostru la data de{' '}
          <span className={styles.highlight}>{consultation.date}</span>,{' '}
          nr. din Registrul de consultații{' '}
          <span className={styles.muted}>{consultation.registryNumber ?? '............'}</span>.
          <br />
          <span className={`${styles.muted} ${styles.italic}`}>Motivele prezentării:</span>
        </div>
      </div>

      {/* ── 4. Patient + meta banner — atomic ────────────────────────────── */}
      <div className={styles.atomic}>
        <div className={styles.banner}>
          <div className={styles.grid3}>
            <div>
              <div className={styles.fieldLabel}>Afecțiune oncologică</div>
              <div
                className={styles.fieldVal}
                style={{ color: consultation.isOncological ? '#c62828' : '#2e7d32' }}
              >
                {consultation.isOncological ? '☑ DA' : '☑ NU'}
              </div>
            </div>
            <div>
              <div className={styles.fieldLabel}>Data consultației</div>
              <div className={styles.fieldVal}>{consultation.date}</div>
            </div>
            <div>
              <div className={styles.fieldLabel}>Nr. registru</div>
              <div className={`${styles.fieldVal} ${styles.muted}`}>
                {consultation.registryNumber ?? DASH}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Diagnostics — atomic ───────────────────────────────────────── */}
      <div className={`${styles.atomic} ${styles.section}`}>
        <SecLabel>Diagnostic</SecLabel>
        {diagnoses.map((d, i) => (
          <div key={i} className={styles.diagItem}>
            <div className={styles.diagRow}>
              <span className={d.isPrimary ? styles.badgePrimary : styles.badgeSec}>
                {d.icdCode} — {d.description}
              </span>
              <span className={styles.diagKind}>{d.isPrimary ? 'principal' : 'secundar'}</span>
            </div>
            {d.detailNotes && (
              <div className={styles.diagDesc}>{d.detailNotes}</div>
            )}
          </div>
        ))}
      </div>

      {/* ── 6. Anamneză | Examen clinic — atomic ─────────────────────────── */}
      <div className={`${styles.atomic} ${styles.grid2} ${styles.section}`}>
        <div>
          <SecLabel>Anamneză</SecLabel>
          <div className={styles.content12}>{dash(anamnesis)}</div>
        </div>
        <div>
          <SecLabel>Examen clinic</SecLabel>
          <div className={styles.content12}>
            {clinicalExam?.general || clinicalExam?.local ? (
              <>
                {clinicalExam.general && <div>— general: {clinicalExam.general}</div>}
                {clinicalExam.local && <div>— local: {clinicalExam.local}</div>}
              </>
            ) : (
              <>
                <div className={styles.muted}>— general</div>
                <div className={styles.muted}>— local</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── 7. Examene laborator | Tip paraclinice — atomic ──────────────── */}
      <div className={`${styles.atomic} ${styles.grid2} ${styles.section}`}>
        <div>
          <SecLabel>Examene de laborator</SecLabel>
          {analysesResults.length > 0 ? (
            analysesResults.map(b => <LabBulletinBlock key={b.id} bulletin={b} />)
          ) : (
            <div className={styles.content12}>
              {labExams?.normalValues || labExams?.pathologicalValues ? (
                <>
                  {labExams.normalValues && (
                    <div>— cu valori normale: {labExams.normalValues}</div>
                  )}
                  {labExams.pathologicalValues && (
                    <div>— cu valori patologice: {labExams.pathologicalValues}</div>
                  )}
                </>
              ) : (
                <>
                  <div className={styles.muted}>— cu valori normale</div>
                  <div className={styles.muted}>— cu valori patologice</div>
                </>
              )}
            </div>
          )}
        </div>
        <div>
          <SecLabel>Tip examene paraclinice</SecLabel>
          <div className={styles.pillRow}>
            {paraclinicTypes.length > 0 ? (
              paraclinicTypes.map((t) => (
                <span key={t} className={styles.pill}>{t}</span>
              ))
            ) : (
              <span className={styles.muted}>{DASH}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── 8. Paraclinice — detalii ──────────────────────────────────────── */}
      {investigations.length > 0 && (
        <div className={styles.section}>
          {/* Heading glued to first block; remaining blocks are each atomic */}
          <div className={styles.atomic}>
            <SecLabel>Examene paraclinice — detalii</SecLabel>
            <InvestigationBlock inv={investigations[0]} />
          </div>
          {investigations.slice(1).map((inv, i) => (
            <div key={i + 1} className={styles.atomic}>
              <InvestigationBlock inv={inv} />
            </div>
          ))}
        </div>
      )}

      {/* ── 9. Tratament efectuat | Alte informații — atomic ─────────────── */}
      <div className={`${styles.atomic} ${styles.contentBlock} ${styles.section}`}>
        <div className={styles.grid2}>
          <div>
            <SecLabel>Tratament efectuat</SecLabel>
            <div className={styles.content12}>{dash(treatmentAdministered)}</div>
          </div>
          <div>
            <SecLabel>Alte informații</SecLabel>
            <div className={styles.content12}>{dash(additionalInfo)}</div>
          </div>
        </div>
      </div>

      {/* ── 10. Tratament recomandat — atomic ─────────────────────────────── */}
      <div className={`${styles.atomic} ${styles.contentBlock} ${styles.section}`}>
        <SecLabel>Tratament recomandat</SecLabel>
        <div className={styles.cnasMention}>
          Se va specifica durata pentru care se poate prescrie de medicul din ambulatoriu,
          inclusiv medicul de familie.
        </div>
        <div className={styles.content12}>{dash(recommendedTreatment)}</div>
      </div>

      {/* ── 11. Checkbox summary — atomic ─────────────────────────────────── */}
      <div className={`${styles.atomic} ${styles.contentBlock} ${styles.checkboxBanner}`}>
        <div className={styles.checkRow}>
          <span>{cb.returnHosp}</span>
          <span>{cb.prescription}</span>
          <span>{cb.leave}</span>
          <span>{cb.homeCare}</span>
          <span className={styles.spanFull}>{cb.devices}</span>
        </div>
      </div>

      {/* ── 12. Footer — atomic ───────────────────────────────────────────── */}
      <div className={`${styles.atomic} ${styles.footer}`}>
        <div>
          <div className={styles.fieldLabel}>Calea de transmitere</div>
          <div>
            {transmission === 'through_patient' ? '☑ prin asigurat' : '☑ prin poștă'}
          </div>
        </div>
        <div className={styles.footerCenter}>
          <div className={styles.fieldLabel}>Data eliberării</div>
          <div className={styles.strong}>{issueDate}</div>
        </div>
        <div className={styles.footerRight}>
          <div className={styles.fieldLabel}>Semnătura și parafa</div>
          <div className={styles.strong}>{doctorSignature}</div>
          <div className={styles.signatureLine} />
        </div>
      </div>

    </div>
  )
}
