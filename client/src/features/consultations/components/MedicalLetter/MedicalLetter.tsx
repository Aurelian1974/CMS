import type { ReactNode } from 'react'
import { describeStructuredData } from '@/features/consultations/investigations/config/investigationSchemas'
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

export interface LetterMedication {
  name: string
  details?: string
  /** Dimineață – după-amiază – seara, ex. „1 – 0 – 0,5” */
  posology?: string
  days?: string
  quantity?: string
  /** Lista CNAS de compensare; lipsă = necompensat */
  compensationList?: string
  notes?: string
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
    presentationReasons?: string
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
  recommendedAnalyses?: Array<{ name: string; priority?: string; notes?: string }>
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
  prescribedMedications?: LetterMedication[]
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

// Titlu scurt la început de rând, fără cifre sau punctuație, ca să nu îngroșăm fraze care conțin ":".
const HEADING_RE = /^([A-ZĂÂÎȘȚŞŢ][\p{L}\u2080-\u2089 /]{1,40}):\s*(.*)$/u

function HeadedParagraphs({ text }: { text: string | null | undefined }) {
  const lines = text?.split(/\n+/).map(l => l.trim()).filter(Boolean) ?? []
  if (lines.length === 0) return <>{DASH}</>
  return (
    <>
      {lines.map((line, i) => {
        const m = HEADING_RE.exec(line)
        return (
          <div key={i} className={styles.headedPara}>
            {m ? <><span className={styles.paraHeading}>{m[1]}:</span> {m[2]}</> : line}
          </div>
        )
      })}
    </>
  )
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

// ─── Paraclinic exam: title + details of every instance of that exam ─────────────────
type Investigation = MedicalLetterProps['investigations'][number]

const SPIROMETRY_KEYS = ['fvc', 'fev1', 'fev1_FVC_Ratio', 'pef']

const isFilled = (v: unknown) => v !== null && v !== undefined && v !== ''

function StructuredList({ typeCode, data }: { typeCode: string; data: Record<string, unknown> }) {
  return (
    <div className={styles.structList}>
      {describeStructuredData(typeCode, data).map(({ label, value }) => (
        <div key={label}>
          <span className={styles.paraHeading}>{label}:</span> {value}
        </div>
      ))}
    </div>
  )
}

function InvestigationDetails({ inv }: { inv: Investigation }) {
  const data = inv.structuredData ?? null
  const isSpirometry = data != null && SPIROMETRY_KEYS.some(k => isFilled(data[k]))
  const hasStructured = data != null && Object.values(data).some(isFilled)

  return (
    <>
      {isSpirometry && <SpirometryCards data={data} />}
      {!isSpirometry && hasStructured && <StructuredList typeCode={inv.type} data={data} />}

      {inv.narrative ? (
        hasStructured ? (
          <div className={styles.narrativeBlock}>
            <div className={styles.noteLabel}>Note clinice</div>
            <div className={styles.noteText}>{inv.narrative}</div>
          </div>
        ) : (
          <div className={styles.noteText}>{inv.narrative}</div>
        )
      ) : (
        !hasStructured && <div className={styles.noteMuted}>{DASH}</div>
      )}
    </>
  )
}

function ParaclinicGroup({ title, items }: { title: string; items: Investigation[] }) {
  const hasStructured = items.some(i => i.structuredData != null)

  return (
    <div className={styles.investBlock}>
      <div className={`${styles.investTitle} ${hasStructured ? styles.investTitleBrand : ''}`}>
        {title}
      </div>
      {items.length > 0
        ? items.map((inv, i) => (
            <div key={i} className={styles.headedPara}><InvestigationDetails inv={inv} /></div>
          ))
        : <div className={styles.noteMuted}>{DASH}</div>}
    </div>
  )
}

function groupParaclinic(investigations: Investigation[], types: string[]) {
  const groups = new Map<string, Investigation[]>()
  for (const inv of investigations) {
    const title = inv.displayName ?? inv.type
    groups.set(title, [...(groups.get(title) ?? []), inv])
  }
  for (const t of types) if (!groups.has(t)) groups.set(t, [])
  return [...groups.entries()]
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

function MedicationsTable({ items }: { items: LetterMedication[] }) {
  return (
    <table className={styles.medTable}>
      <thead>
        <tr>
          <th className={styles.medColIndex}>Nr.</th>
          <th>Medicament</th>
          <th className={styles.medColCenter}>
            Posologie
            <div className={styles.medSubHeader}>dim. – d-a. – seara</div>
          </th>
          <th className={styles.medColCenter}>Zile</th>
          <th className={styles.medColCenter}>Cantitate</th>
          <th className={styles.medColCenter}>Compensare</th>
          <th>Observații</th>
        </tr>
      </thead>
      <tbody>
        {items.map((m, i) => (
          <tr key={i} className={m.compensationList ? styles.medRowCompensated : undefined}>
            <td className={styles.medColIndex}>{i + 1}</td>
            <td>
              <div className={styles.medName}>{m.name}</div>
              {m.details && <div className={styles.medDetails}>{m.details}</div>}
            </td>
            <td className={styles.medColCenter}>{dash(m.posology)}</td>
            <td className={styles.medColCenter}>{dash(m.days)}</td>
            <td className={`${styles.medColCenter} ${styles.strong}`}>{dash(m.quantity)}</td>
            <td className={styles.medColCenter}>
              {m.compensationList
                ? <span className={styles.medCompensated}>Compensat · {m.compensationList}</span>
                : <span className={styles.muted}>Necompensat</span>}
            </td>
            <td>{dash(m.notes)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
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
  recommendedAnalyses = [],
  paraclinicTypes = [],
  investigations,
  treatmentAdministered,
  additionalInfo,
  prescribedMedications = [],
  recommendedTreatment,
  checkboxes,
  transmission,
  issueDate,
  doctorSignature,
}: MedicalLetterProps) => {
  const cb = resolveCheckboxLabels(checkboxes)
  const paraclinicGroups = groupParaclinic(investigations, paraclinicTypes)

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
          {consultation.presentationReasons && <> {consultation.presentationReasons}</>}
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

      {/* ── 6. Anamneză, apoi Examen clinic — fiecare atomic ────────────────── */}
      <div className={`${styles.atomic} ${styles.section}`}>
        <SecLabel>Anamneză</SecLabel>
        <div className={styles.content12}><HeadedParagraphs text={anamnesis} /></div>
      </div>
      <div className={`${styles.atomic} ${styles.section}`}>
        <div>
          <SecLabel>Examen clinic</SecLabel>
          <div className={styles.content12}>
            {clinicalExam?.general || clinicalExam?.local ? (
              <>
                {clinicalExam.general && (
                  <div className={styles.headedPara}>
                    <div className={styles.examSubLabel}>— general</div>
                    <HeadedParagraphs text={clinicalExam.general} />
                  </div>
                )}
                {clinicalExam.local && (
                  <div className={styles.headedPara}>
                    <div className={styles.examSubLabel}>— local</div>
                    <HeadedParagraphs text={clinicalExam.local} />
                  </div>
                )}
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

      {/* ── 7. Examene laborator — atomic ────────────────────────────────── */}
      <div className={`${styles.atomic} ${styles.section}`}>
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
      </div>

      {recommendedAnalyses.length > 0 && (
        <div className={`${styles.atomic} ${styles.section}`}>
          <SecLabel>Analize recomandate</SecLabel>
          <div className={styles.content12}>
            {recommendedAnalyses.map((a, i) => (
              <div key={i} className={styles.headedPara}>
                <span className={styles.paraHeading}>{a.name}</span>
                {a.priority && <> ({a.priority})</>}
                {a.notes && <> — {a.notes}</>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 8. Examene paraclinice — fiecare examen urmat de detaliile lui ─── */}
      {/* data-print-split: previzualizarea tipăririi poate rupe secțiunea între examene */}
      <div className={styles.section} data-print-split>
        {paraclinicGroups.length > 0 ? (
          paraclinicGroups.map(([title, items], i) => (
            // Titlul secțiunii rămâne lipit de primul examen la paginare
            <div key={title} className={styles.atomic}>
              {i === 0 && <SecLabel>Examene paraclinice</SecLabel>}
              <ParaclinicGroup title={title} items={items} />
            </div>
          ))
        ) : (
          <div className={styles.atomic}>
            <SecLabel>Examene paraclinice</SecLabel>
            <span className={styles.muted}>{DASH}</span>
          </div>
        )}
      </div>

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
        {prescribedMedications.length > 0 ? (
          <>
            <MedicationsTable items={prescribedMedications} />
            {recommendedTreatment?.trim() && (
              <div className={styles.content12}>
                <div className={styles.paraHeading}>Recomandări:</div>
                <div className={styles.preLine}>{recommendedTreatment.trim()}</div>
              </div>
            )}
          </>
        ) : (
          <div className={styles.content12}>{dash(recommendedTreatment)}</div>
        )}
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
