import { useState, useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { ConsultationDetailDto, ConsultationInvestigationDto } from '../../types/consultation.types'
import { useCurrentClinic } from '@/features/clinic/hooks/useClinic'
import { AppButton } from '@/components/ui/AppButton'
import { MedicalLetter } from '../MedicalLetter'
import type { MedicalLetterProps, LabAnalysesBulletin } from '../MedicalLetter'
import { analysesResultsApi } from '@/api/endpoints/analysesResults.api'
import styles from './ScrisoareMedicalaModal.module.scss'

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  detail: ConsultationDetailDto
  onClose: () => void
}

// ── Data type ─────────────────────────────────────────────────────────────────
export interface ScrisoareMedicalaData {
  // Antet
  furnizorNume: string
  medicNume: string
  medicParafa: string
  contractNr: string
  cas: string
  // Pacient
  patientName: string
  patientBirthDate: string
  patientCnp: string
  dataPrezentare: string
  nrRegistru: string
  // Conținut
  motivePrezentare: string
  esteOncologic: boolean
  diagnostic: string
  anamneza: string
  factoriDeRisc: string
  examenClinicGeneral: string
  examenClinicLocal: string
  labValoriNormale: string
  labValoriPatologice: string
  ekg: string
  eco: string
  rx: string
  alteExamene: string
  tratamentEfectuat: string
  alteInformatii: string
  tratamentRecomandat: string
  // Indicație revenire
  indicatieRevenire: 'da' | 'nu'
  termenRevenire: string
  // Documente
  prescriptieStatus: 'eliberata' | 'nu_necesar' | 'nu_eliberata'
  prescriptieSerie: string
  concediuStatus: 'eliberat' | 'nu_necesar' | 'nu_eliberat'
  concediuSerie: string
  ingrijiriStatus: 'eliberata' | 'nu_necesar'
  dispozitiveStatus: 'eliberata' | 'nu_necesar'
  // Transmitere
  caleaTransmitere: 'asigurat' | 'posta'
  postaAdresa: string
  dataScrisorii: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function stripHtml(html: string | null | undefined): string {
  if (!html) return ''
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<li>/gi, '• ')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

interface SecondaryDiagnosis {
  description?: string
  icd10Codes?: { code: string; shortDescriptionRo?: string }[]
}

function parseDiagnosticText(detail: ConsultationDetailDto): string {
  const parts: string[] = []

  // detail.diagnostic poate fi JSON complex (obiect cu primaryCode) sau text simplu
  if (detail.diagnostic) {
    let handled = false
    try {
      const parsed = JSON.parse(detail.diagnostic)
      if (parsed?.primaryCode?.code) {
        handled = true
        const primary = parsed.primaryCode
        parts.push(`${primary.code} — ${primary.shortDescriptionRo ?? primary.shortDescriptionEn ?? ''}`)
        if (parsed.primaryDetails) parts.push(`Detalii: ${stripHtml(parsed.primaryDetails)}`)
        if (Array.isArray(parsed.secondaryDiagnoses) && parsed.secondaryDiagnoses.length > 0) {
          parsed.secondaryDiagnoses.forEach((sd: SecondaryDiagnosis) => {
            const codeLine = sd.icd10Codes
              ?.map(c => `${c.code} — ${c.shortDescriptionRo ?? ''}`)
              .join('; ') ?? ''
            const desc = stripHtml(sd.description ?? '')
            if (desc && codeLine) parts.push(`Secundar: ${desc} (${codeLine})`)
            else if (codeLine) parts.push(`Secundar: ${codeLine}`)
            else if (desc) parts.push(`Secundar: ${desc}`)
          })
        }
      }
    } catch { /* not JSON */ }
    if (!handled) parts.push(stripHtml(detail.diagnostic))
  }

  // detail.diagnosticCodes: string simplu "L10.0, I10" sau JSON array
  if (detail.diagnosticCodes) {
    try {
      const parsed = JSON.parse(detail.diagnosticCodes)
      if (Array.isArray(parsed) && parsed.length > 0) {
        parts.push(`Coduri: ${(parsed as string[]).join(', ')}`)
      }
    } catch {
      // string simplu — adaugă doar dacă nu e deja inclus din diagnostic
      const codes = detail.diagnosticCodes.trim()
      if (codes && !parts.some(p => p.includes(codes.split(',')[0]?.trim() ?? ''))) {
        parts.push(`Coduri: ${codes}`)
      }
    }
  }

  return parts.filter(Boolean).join('\n')
}

function formatBirthDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch { return dateStr }
}

function todayRo(): string {
  return new Date().toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function formatDateRo(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  try {
    return new Date(dateStr).toLocaleDateString('ro-RO', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    })
  } catch { return dateStr }
}

function buildExamenClinicLocal(detail: ConsultationDetailDto): string {
  const sections: Array<{ label: string; value: string }> = [
    { label: 'Examen obiectiv detaliat', value: stripHtml(detail.examenClinic) },
    { label: 'Alte observații clinice',  value: stripHtml(detail.alteObservatiiClinice) },
  ]
  const filled = sections.filter(s => s.value)
  if (filled.length === 0) return 'Fără'
  return filled.map(s => `${s.label}: ${s.value}`).join('\n\n')
}

function buildExamenClinicGeneral(detail: ConsultationDetailDto): string {
  const lines: string[] = []

  if (detail.stareGenerala)        lines.push(`Stare generală: ${detail.stareGenerala}`)
  if (detail.tegumente)            lines.push(`Tegumente: ${detail.tegumente}`)
  if (detail.mucoase)              lines.push(`Mucoase: ${detail.mucoase}`)

  const greutate = detail.greutate != null ? `${detail.greutate} kg` : null
  const inaltime = detail.inaltime != null ? `${detail.inaltime} cm` : null
  if (greutate || inaltime) {
    const imc =
      detail.greutate && detail.inaltime
        ? ` (IMC: ${(detail.greutate / ((detail.inaltime / 100) ** 2)).toFixed(1)} kg/m²)`
        : ''
    lines.push(`Greutate/Înălțime: ${[greutate, inaltime].filter(Boolean).join(', ')}${imc}`)
  }

  if (detail.tensiuneSistolica != null || detail.tensiuneDiastolica != null)
    lines.push(`Tensiune arterială: ${detail.tensiuneSistolica ?? '?'}/${detail.tensiuneDiastolica ?? '?'} mmHg`)

  if (detail.puls != null)
    lines.push(`Frecvență cardiacă: ${detail.puls} bpm`)

  if (detail.frecventaRespiratorie != null)
    lines.push(`Frecvență respiratorie: ${detail.frecventaRespiratorie} r/min`)

  if (detail.temperatura != null)
    lines.push(`Temperatură: ${detail.temperatura} °C`)

  if (detail.spO2 != null)
    lines.push(`SpO₂: ${detail.spO2}%`)

  if (detail.edeme)                lines.push(`Edeme: ${detail.edeme}`)
  if (detail.glicemie != null)     lines.push(`Glicemie: ${detail.glicemie} mg/dL`)
  if (detail.ganglioniLimfatici)   lines.push(`Ganglioni limfatici: ${detail.ganglioniLimfatici}`)

  return lines.length > 0 ? lines.join('\n') : 'Fără'
}

function buildAnamneza(detail: ConsultationDetailDto): string {
  const sections: Array<{ label: string; value: string }> = [
    { label: 'Istoric boală actuală', value: stripHtml(detail.istoricBoalaActuala) },
    { label: 'Antecedente personale', value: stripHtml(detail.istoricMedicalPersonal) },
    { label: 'Istoric familial',      value: stripHtml(detail.istoricFamilial) },
  ]
  const filled = sections.filter(s => s.value)
  if (filled.length === 0) return 'Fără'
  return filled.map(s => `${s.label}: ${s.value}`).join('\n\n')
}

// Tipuri de investigații mapate pe câmpurile formularului
const EKG_TYPES = new Set(['ECG', 'Holter_ECG', 'Holter_BP', 'StressTest'])
const ECO_TYPES = new Set(['Echocardiography', 'Ultrasound', 'DopplerUS'])
const RX_TYPES  = new Set(['XRay_Chest', 'Mammography', 'DEXA'])

function formatInvestigationEntry(inv: ConsultationInvestigationDto): string {
  const parts: string[] = []

  if (inv.structuredData) {
    try {
      const obj = JSON.parse(inv.structuredData) as Record<string, unknown>
      const lines = Object.entries(obj)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `  ${k}: ${v}`)
      if (lines.length > 0) {
        parts.push(`Date structurate:\n${lines.join('\n')}`)
      }
    } catch {
      parts.push(inv.structuredData)
    }
  }

  const narrativeText = stripHtml(inv.narrative)
  if (narrativeText) {
    parts.push(`Note clinice: ${narrativeText}`)
  }

  if (parts.length === 0) return inv.investigationTypeDisplayName
  return `${inv.investigationTypeDisplayName}:\n${parts.join('\n')}`
}

function buildInvestigations(detail: ConsultationDetailDto) {
  const format = formatInvestigationEntry
  const invs = detail.investigations ?? []
  const ekg    = invs.filter(i => EKG_TYPES.has(i.investigationType)).map(format).join('\n')
  const eco    = invs.filter(i => ECO_TYPES.has(i.investigationType)).map(format).join('\n')
  const rx     = invs.filter(i => RX_TYPES.has(i.investigationType)).map(format).join('\n')
  const altele = invs
    .filter(i => !EKG_TYPES.has(i.investigationType) && !ECO_TYPES.has(i.investigationType) && !RX_TYPES.has(i.investigationType))
    .map(format).join('\n')
  return { ekg, eco, rx, altele }
}

function initFromDetail(detail: ConsultationDetailDto): ScrisoareMedicalaData {
  const invs = buildInvestigations(detail)
  return {
    furnizorNume: '',
    medicNume: detail.doctorName ?? '',
    medicParafa: detail.doctorMedicalCode ?? '',
    contractNr: '',
    cas: '',
    patientName: detail.patientName ?? '',
    patientBirthDate: formatBirthDate(detail.patientBirthDate),
    patientCnp: detail.patientCnp ?? '',
    dataPrezentare: formatDateRo(detail.date),
    nrRegistru: '',
    motivePrezentare: stripHtml(detail.motiv),
    esteOncologic: detail.esteAfectiuneOncologica ?? false,
    diagnostic: parseDiagnosticText(detail),
    anamneza: buildAnamneza(detail),
    factoriDeRisc: stripHtml(detail.factoriDeRisc) || 'Fără',
    examenClinicGeneral: buildExamenClinicGeneral(detail),
    examenClinicLocal: buildExamenClinicLocal(detail),
    labValoriNormale: '',
    labValoriPatologice: '',
    ekg:         invs.ekg,
    eco:         invs.eco,
    rx:          invs.rx,
    alteExamene: invs.altele,
    tratamentEfectuat: stripHtml(detail.tratamentAnterior),
    alteInformatii: stripHtml(detail.observatii),
    tratamentRecomandat: stripHtml(detail.recomandari),
    indicatieRevenire: 'nu',
    termenRevenire: '',
    prescriptieStatus: detail.saEliberatPrescriptie ? 'eliberata' : 'nu_necesar',
    prescriptieSerie: detail.seriePrescriptie ?? '',
    concediuStatus: detail.saEliberatConcediuMedical ? 'eliberat' : 'nu_necesar',
    concediuSerie: detail.serieConcediuMedical ?? '',
    ingrijiriStatus: detail.saEliberatIngrijiriDomiciliu ? 'eliberata' : 'nu_necesar',
    dispozitiveStatus: detail.saEliberatDispozitiveMedicale ? 'eliberata' : 'nu_necesar',
    caleaTransmitere: 'asigurat',
    postaAdresa: '',
    dataScrisorii: todayRo(),
  }
}

// ── Small reusable field helpers ──────────────────────────────────────────────
type UpdateFn = <K extends keyof ScrisoareMedicalaData>(key: K, val: ScrisoareMedicalaData[K]) => void

function FInput({ label, value, onChange, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; hint?: string
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {hint && <span className={styles.fieldHint}>{hint}</span>}
      <input className={styles.fieldInput} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  )
}

function FTextarea({ label, value, onChange, rows = 3, placeholder, hint }: {
  label: string; value: string; onChange: (v: string) => void
  rows?: number; placeholder?: string; hint?: string
}) {
  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{label}</label>
      {hint && <span className={styles.fieldHint}>{hint}</span>}
      <textarea
        className={styles.fieldTextarea}
        value={value}
        rows={rows}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  )
}

// ── Form content ──────────────────────────────────────────────────────────────
function FormContent({ data, update }: { data: ScrisoareMedicalaData; update: UpdateFn }) {
  return (
    <div className={styles.formBody}>

      {/* ── Antet ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Date furnizor</div>
        <div className={styles.grid2}>
          <FInput label="Denumire Furnizor *" value={data.furnizorNume} onChange={v => update('furnizorNume', v)} placeholder="Clinica / Spitalul..." />
          <FInput label="Contract / convenție nr." value={data.contractNr} onChange={v => update('contractNr', v)} placeholder="Nr. contract CAS" />
          <FInput label="CAS" value={data.cas} onChange={v => update('cas', v)} placeholder="Casa de Asigurări de Sănătate" />
          <FInput label="Medic" value={data.medicNume} onChange={v => update('medicNume', v)} />
          <FInput label="Parafa medic" value={data.medicParafa} onChange={v => update('medicParafa', v)} />
          <FInput label="Data scrisorii" value={data.dataScrisorii} onChange={v => update('dataScrisorii', v)} />
        </div>
      </div>

      {/* ── Pacient ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Date pacient și consultație</div>
        <div className={styles.grid2}>
          <FInput label="Pacient" value={data.patientName} onChange={v => update('patientName', v)} hint="Pre-completat din consultație" />
          <FInput label="Data nașterii" value={data.patientBirthDate} onChange={v => update('patientBirthDate', v)} placeholder="zz.ll.aaaa" hint="Pre-completat din fișa pacientului" />
          <FInput label="CNP / cod asigurare" value={data.patientCnp} onChange={v => update('patientCnp', v)} hint="Pre-completat din fișa pacientului" />
          <FInput label="Data prezentării" value={data.dataPrezentare} onChange={v => update('dataPrezentare', v)} hint="Pre-completat din consultație" />
          <FInput label="Nr. din Registrul de consultații *" value={data.nrRegistru} onChange={v => update('nrRegistru', v)} placeholder="ex. 1234 / nr. F.O." />
        </div>
      </div>

      {/* ── Motive + Diagnostic ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Prezentare și diagnostic</div>
        <FTextarea label="Motivele prezentării" value={data.motivePrezentare} onChange={v => update('motivePrezentare', v)} rows={3} hint="Pre-completat din câmpul «Motiv» al consultației" />
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Pacient diagnosticat cu afecțiune oncologică</label>
          <div className={styles.radioRow}>
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.esteOncologic} onChange={() => update('esteOncologic', true)} /> DA
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" checked={!data.esteOncologic} onChange={() => update('esteOncologic', false)} /> NU
            </label>
          </div>
        </div>
        <FTextarea label="Diagnosticul și codul de diagnostic" value={data.diagnostic} onChange={v => update('diagnostic', v)} rows={4} hint="Pre-completat din câmpul diagnostic + coduri ICD-10" />
      </div>

      {/* ── Anamneză ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Anamneză</div>
        <FTextarea label="Anamneză" value={data.anamneza} onChange={v => update('anamneza', v)} rows={4} hint="Pre-completat din Istoric boală actuală + Antecedente + Istoric familial" />
        <FTextarea label="Factori de risc" value={data.factoriDeRisc} onChange={v => update('factoriDeRisc', v)} rows={2} hint="Pre-completat din câmpul Factori de risc" />
      </div>

      {/* ── Examen clinic ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Examen clinic</div>
        <FTextarea label="Examen clinic — general" value={data.examenClinicGeneral} onChange={v => update('examenClinicGeneral', v)} rows={4} hint="Pre-completat din câmpul Examen clinic" />
        <FTextarea label="Examen clinic — local *" value={data.examenClinicLocal} onChange={v => update('examenClinicLocal', v)} rows={3} placeholder="Descriere examen clinic local (completați manual)" hint="Pre-completat din Alte observații clinice — verificați și completați dacă lipsește" />
      </div>

      {/* ── Examene laborator ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Examene de laborator</div>
        <FTextarea label="Valori în limite normale *" value={data.labValoriNormale} onChange={v => update('labValoriNormale', v)} rows={3} placeholder="ex. Glicemie 95 mg/dl, Hemoglobină 13,5 g/dl..." hint="Completați manual — sintetizați din Analize Medicale ale consultației" />
        <FTextarea label="Valori patologice *" value={data.labValoriPatologice} onChange={v => update('labValoriPatologice', v)} rows={3} placeholder="ex. TGP 85 U/L (N<40), Colesterol total 245 mg/dl..." hint="Completați manual — valorile cu deviații de la normal" />
      </div>

      {/* ── Examene paraclinice ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Examene paraclinice</div>
        <div className={styles.grid2}>
          <FTextarea label="EKG *" value={data.ekg} onChange={v => update('ekg', v)} rows={2} placeholder="Rezultat EKG" hint="Pre-completat din tab-ul Investigații (ECG, Holter, StressTest)" />
          <FTextarea label="ECO *" value={data.eco} onChange={v => update('eco', v)} rows={2} placeholder="Rezultat ecocardiografie / ecografie" hint="Pre-completat din tab-ul Investigații (Echo, Ecografie, Doppler)" />
          <FTextarea label="Rx *" value={data.rx} onChange={v => update('rx', v)} rows={2} placeholder="Rezultat radiografie" hint="Pre-completat din tab-ul Investigații (Rx, Mamografie, DEXA)" />
          <FTextarea label="Altele *" value={data.alteExamene} onChange={v => update('alteExamene', v)} rows={2} placeholder="CT, RMN, spirometrie, endoscopie etc." hint="Pre-completat din tab-ul Investigații (CT, RMN, spirometrie, bronhoscopie etc.)" />
        </div>
      </div>

      {/* ── Tratament + Alte info ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Tratament și informații suplimentare</div>
        <FTextarea label="Tratament efectuat" value={data.tratamentEfectuat} onChange={v => update('tratamentEfectuat', v)} rows={3} hint="Pre-completat din câmpul Tratament anterior" />
        <FTextarea label="Alte informații referitoare la starea de sănătate a asiguratului" value={data.alteInformatii} onChange={v => update('alteInformatii', v)} rows={3} hint="Pre-completat din câmpul Observații" />
        <FTextarea label="Tratament recomandat" value={data.tratamentRecomandat} onChange={v => update('tratamentRecomandat', v)} rows={5} hint="Pre-completat din câmpul Recomandări" placeholder="Includeți medicamentele cu durata de prescriere..." />
      </div>

      {/* ── Indicație revenire ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Indicație de revenire pentru internare</div>
        <div className={styles.field}>
          <div className={styles.radioCol}>
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.indicatieRevenire === 'da'} onChange={() => update('indicatieRevenire', 'da')} />
              Da, revine pentru internare
            </label>
            {data.indicatieRevenire === 'da' && (
              <FInput label="Termen de revenire" value={data.termenRevenire} onChange={v => update('termenRevenire', v)} placeholder="ex. 30 de zile" />
            )}
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.indicatieRevenire === 'nu'} onChange={() => update('indicatieRevenire', 'nu')} />
              Nu, nu este necesară revenirea pentru internare
            </label>
          </div>
        </div>
      </div>

      {/* ── Documente eliberate ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Documente eliberate</div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Prescripție medicală</label>
          <div className={styles.radioCol}>
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.prescriptieStatus === 'eliberata'} onChange={() => update('prescriptieStatus', 'eliberata')} />
              S-a eliberat prescripție medicală
            </label>
            {data.prescriptieStatus === 'eliberata' && (
              <FInput label="Serie / număr prescripție" value={data.prescriptieSerie} onChange={v => update('prescriptieSerie', v)} placeholder="seria și numărul" />
            )}
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.prescriptieStatus === 'nu_necesar'} onChange={() => update('prescriptieStatus', 'nu_necesar')} />
              Nu s-a eliberat prescripție medicală deoarece nu a fost necesar
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.prescriptieStatus === 'nu_eliberata'} onChange={() => update('prescriptieStatus', 'nu_eliberata')} />
              Nu s-a eliberat prescripție medicală
            </label>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Concediu medical</label>
          <div className={styles.radioCol}>
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.concediuStatus === 'eliberat'} onChange={() => update('concediuStatus', 'eliberat')} />
              S-a eliberat concediu medical la externare / consultația din ambulatoriu
            </label>
            {data.concediuStatus === 'eliberat' && (
              <FInput label="Serie / număr concediu medical" value={data.concediuSerie} onChange={v => update('concediuSerie', v)} placeholder="seria și numărul" />
            )}
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.concediuStatus === 'nu_necesar'} onChange={() => update('concediuStatus', 'nu_necesar')} />
              Nu s-a eliberat concediu medical la externare deoarece nu a fost necesar
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.concediuStatus === 'nu_eliberat'} onChange={() => update('concediuStatus', 'nu_eliberat')} />
              Nu s-a eliberat concediu medical la externare
            </label>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Recomandare pentru îngrijiri medicale la domiciliu / paliative</label>
          <div className={styles.radioCol}>
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.ingrijiriStatus === 'eliberata'} onChange={() => update('ingrijiriStatus', 'eliberata')} />
              S-a eliberat recomandare pentru îngrijiri medicale la domiciliu / paliative
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.ingrijiriStatus === 'nu_necesar'} onChange={() => update('ingrijiriStatus', 'nu_necesar')} />
              Nu s-a eliberat recomandare — nu a fost necesar
            </label>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.fieldLabel}>Prescripție medicală pentru dispozitive medicale în ambulatoriu</label>
          <div className={styles.radioCol}>
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.dispozitiveStatus === 'eliberata'} onChange={() => update('dispozitiveStatus', 'eliberata')} />
              S-a eliberat prescripție medicală pentru dispozitive medicale în ambulatoriu
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.dispozitiveStatus === 'nu_necesar'} onChange={() => update('dispozitiveStatus', 'nu_necesar')} />
              Nu s-a eliberat prescripție medicală pentru dispozitive medicale — nu a fost necesar
            </label>
          </div>
        </div>
      </div>

      {/* ── Calea de transmitere ── */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Calea de transmitere</div>
        <div className={styles.field}>
          <div className={styles.radioCol}>
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.caleaTransmitere === 'asigurat'} onChange={() => update('caleaTransmitere', 'asigurat')} />
              Prin asigurat (pacient)
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" checked={data.caleaTransmitere === 'posta'} onChange={() => update('caleaTransmitere', 'posta')} />
              Prin poștă
            </label>
            {data.caleaTransmitere === 'posta' && (
              <FInput label="Adresa destinatarului" value={data.postaAdresa} onChange={v => update('postaAdresa', v)} placeholder="Adresa completă..." />
            )}
          </div>
        </div>
      </div>

    </div>
  )
}

// ── Preview content ───────────────────────────────────────────────────────────
// ─── Diagnosis parser for MedicalLetterProps ────────────────────────────────
function buildDiagnoses(detail: ConsultationDetailDto): MedicalLetterProps['diagnoses'] {
  if (!detail.diagnostic) return []
  try {
    const parsed = JSON.parse(detail.diagnostic)
    if (parsed?.primaryCode?.code) {
      const result: MedicalLetterProps['diagnoses'] = []
      const primary = parsed.primaryCode as { code: string; shortDescriptionRo?: string; shortDescriptionEn?: string }
      result.push({
        icdCode: primary.code,
        description: primary.shortDescriptionRo ?? primary.shortDescriptionEn ?? '',
        detailNotes: stripHtml(parsed.primaryDetails as string | undefined) || undefined,
        isPrimary: true,
      })
      if (Array.isArray(parsed.secondaryDiagnoses)) {
        ;(parsed.secondaryDiagnoses as SecondaryDiagnosis[]).forEach((sd) => {
          const icdCode = sd.icd10Codes?.[0]?.code ?? ''
          const description = sd.icd10Codes?.[0]?.shortDescriptionRo ?? ''
          result.push({
            icdCode,
            description,
            detailNotes: stripHtml(sd.description) || undefined,
            isPrimary: false,
          })
        })
      }
      return result
    }
  } catch { /* not JSON */ }
  return [{ icdCode: '', description: stripHtml(detail.diagnostic), isPrimary: true }]
}

// ─── Converter: ScrisoareMedicalaData + detail → MedicalLetterProps ───────────
function buildMedicalLetterProps(
  data: ScrisoareMedicalaData,
  detail: ConsultationDetailDto,
): MedicalLetterProps {
  const invs = detail.investigations ?? []

  const investigations: MedicalLetterProps['investigations'] = invs.map((inv) => {
    let structuredData: Record<string, unknown> | null = null
    if (inv.structuredData) {
      try { structuredData = JSON.parse(inv.structuredData) } catch { /* ignore */ }
    }
    return {
      type: inv.investigationType,
      displayName: inv.investigationTypeDisplayName,
      structuredData,
      narrative: inv.narrative ? stripHtml(inv.narrative) : null,
    }
  })

  // Derive pill labels from unique display names (capped to keep the row tidy)
  const paraclinicTypes = Array.from(
    new Set(invs.map((i) => i.investigationTypeDisplayName)),
  ).slice(0, 10)

  const anamnesisParts = [
    data.anamneza,
    data.factoriDeRisc && data.factoriDeRisc !== 'Fără'
      ? `Factori de risc: ${data.factoriDeRisc}`
      : null,
  ].filter(Boolean) as string[]

  return {
    provider: {
      name: data.furnizorNume,
      doctorName: data.medicNume,
      contractNumber: data.contractNr,
      cas: data.cas || undefined,
    },
    patient: {
      name: data.patientName,
      birthDate: data.patientBirthDate,
      cnp: data.patientCnp,
    },
    consultation: {
      date: data.dataPrezentare,
      registryNumber: data.nrRegistru || undefined,
      isOncological: data.esteOncologic,
    },
    diagnoses: buildDiagnoses(detail),
    anamnesis: anamnesisParts.join('\n\n') || undefined,
    clinicalExam: {
      general:
        data.examenClinicGeneral && data.examenClinicGeneral !== 'Fără'
          ? data.examenClinicGeneral
          : undefined,
      local:
        data.examenClinicLocal && data.examenClinicLocal !== 'Fără'
          ? data.examenClinicLocal
          : undefined,
    },
    labExams: {
      normalValues: data.labValoriNormale || undefined,
      pathologicalValues: data.labValoriPatologice || undefined,
    },
    paraclinicTypes,
    investigations,
    treatmentAdministered: data.tratamentEfectuat || undefined,
    additionalInfo: data.alteInformatii || undefined,
    recommendedTreatment: data.tratamentRecomandat || undefined,
    checkboxes: {
      returnForHospitalization: data.indicatieRevenire === 'da',
      prescriptionIssued:
        data.prescriptieStatus === 'eliberata' ? 'issued'
        : data.prescriptieStatus === 'nu_necesar' ? 'not_needed'
        : 'not_issued',
      medicalLeaveIssued:
        data.concediuStatus === 'eliberat' ? 'issued'
        : data.concediuStatus === 'nu_necesar' ? 'not_needed'
        : 'not_issued',
      homeCarePrescription: data.ingrijiriStatus === 'eliberata',
      medicalDevicePrescription: data.dispozitiveStatus === 'eliberata',
    },
    transmission: data.caleaTransmitere === 'posta' ? 'by_mail' : 'through_patient',
    issueDate: data.dataScrisorii,
    doctorSignature: `${data.medicNume}${data.medicParafa ? ` / ${data.medicParafa}` : ''}`,
  }
}

// ─── Preview uses the new MedicalLetter component ─────────────────────────────
function PreviewContent({
  data,
  detail,
  letterRef,
}: {
  data: ScrisoareMedicalaData
  detail: ConsultationDetailDto
  letterRef: RefObject<HTMLDivElement | null>
}) {
  // Fetch analyses results pentru aceasta consultatie (null-safe: da [] cand consultationId lipseste)
  const { data: analysesResponse } = useQuery({
    queryKey: ['analysesResults', 'for-medical-letter', detail.id],
    queryFn: () => analysesResultsApi.getForMedicalLetter(detail.id),
    enabled: !!detail.id,
    staleTime: 5 * 60 * 1000,
  })

  // Mapeaza raspunsul API la LabAnalysesBulletin[] asteptat de MedicalLetter
  const analysesResults: LabAnalysesBulletin[] = (analysesResponse?.bulletins ?? []).map(b => ({
    id: b.id,
    laboratory: b.laboratory,
    bulletinNumber: b.bulletinNumber,
    collectionDate: b.collectionDate,
    details: b.details.map(d => ({
      id: d.id,
      section: d.section,
      testName: d.testName,
      value: d.value,
      unit: d.unit,
      referenceRange: d.referenceRange,
      flag: d.flag,
    })),
  }))

  const letterProps = buildMedicalLetterProps(data, detail)
  return (
    <div className={styles.previewWrapper}>
      <div className={styles.letterPage} ref={letterRef}>
        <MedicalLetter {...letterProps} analysesResults={analysesResults} />
      </div>
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function ScrisoareMedicalaModal({ detail, onClose }: Props) {
  const [view, setView] = useState<'form' | 'preview'>('form')
  const [data, setData] = useState<ScrisoareMedicalaData>(() => initFromDetail(detail))
  const letterRef = useRef<HTMLDivElement>(null)
  // Populate clinic fields from DB (already cached via staleTime: Infinity)
  const { data: clinicResponse } = useCurrentClinic()
  const clinic = clinicResponse?.data
  useEffect(() => {
    if (!clinic) return
    setData(prev => ({
      ...prev,
      furnizorNume: prev.furnizorNume || clinic.name || '',
      contractNr:   prev.contractNr  || clinic.contractCNAS || '',
    }))
  }, [clinic])
  const update = <K extends keyof ScrisoareMedicalaData>(key: K, val: ScrisoareMedicalaData[K]) =>
    setData(prev => ({ ...prev, [key]: val }))

  const handlePrint = () => {
    // Switch to preview first so the letter is rendered in the DOM
    if (view !== 'preview') {
      setView('preview')
      setTimeout(handlePrint, 150)
      return
    }

    const letterEl = letterRef.current
    if (!letterEl) return

    const win = window.open('', '_blank', 'width=960,height=820,scrollbars=yes')
    if (!win) {
      alert('Browserul a blocat fereastra nouă. Permiteți pop-up-uri pentru acest site.')
      return
    }

    // Collect all compiled CSS rules from the current page (includes hashed CSS-module classes)
    const allCss = Array.from(document.styleSheets)
      .flatMap((sheet) => {
        try {
          return Array.from(sheet.cssRules).map((r) => r.cssText)
        } catch {
          // Cross-origin sheet — link it by URL instead
          return sheet.href ? [`@import url("${sheet.href}");`] : []
        }
      })
      .join('\n')

    win.document.write(`<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <title>Scrisoare Medicală — ${data.patientName}</title>
  <style>${allCss}</style>
  <style>body { margin: 0; padding: 0; background: #fff; }</style>
</head>
<body>${letterEl.outerHTML}</body>
</html>`)
    win.document.close()
    setTimeout(() => {
      win.focus()
      win.print()
    }, 600)
  }

  return (
    <div className={styles.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={styles.dialog}>

        {/* Header */}
        <div className={styles.dialogHeader}>
          <div className={styles.dialogTitleGroup}>
            <span className={styles.dialogTitle}>Scrisoare Medicală</span>
            <span className={styles.dialogSubtitle}>{data.patientName}</span>
          </div>
          <div className={styles.dialogControls}>
            <div className={styles.viewToggleGroup}>
              <button
                type="button"
                className={`${styles.viewTab} ${view === 'form' ? styles.viewTabActive : ''}`}
                onClick={() => setView('form')}
              >
                ✏️ Completare
              </button>
              <button
                type="button"
                className={`${styles.viewTab} ${view === 'preview' ? styles.viewTabActive : ''}`}
                onClick={() => setView('preview')}
              >
                👁 Previzualizare
              </button>
            </div>
            {view === 'preview' && (
              <AppButton variant="primary" size="sm" onClick={handlePrint}>
                🖨 Tipărește / PDF
              </AppButton>
            )}
            <button type="button" className={styles.closeBtn} onClick={onClose} title="Închide">✕</button>
          </div>
        </div>

        {/* Body */}
        <div className={styles.dialogBody}>
          {view === 'form'    && <FormContent data={data} update={update} />}
          {view === 'preview' && <PreviewContent data={data} detail={detail} letterRef={letterRef} />}
        </div>

      </div>
    </div>
  )
}
