import { useState, useEffect } from 'react'
import type { ConsultationDetailDto, ConsultationInvestigationDto } from '../../types/consultation.types'
import { useCurrentClinic } from '@/features/clinic/hooks/useClinic'
import { AppButton } from '@/components/ui/AppButton'
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

function buildInvestigations(detail: ConsultationDetailDto) {
  const format = (inv: ConsultationInvestigationDto) => {
    const text = stripHtml(inv.narrative)
    return text
      ? `${inv.investigationTypeDisplayName}: ${text}`
      : inv.investigationTypeDisplayName
  }
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

// ── Print HTML generator ──────────────────────────────────────────────────────
function cb(checked: boolean): string {
  return checked ? '☑' : '☐'
}

function dotLine(val: string, placeholder = ''): string {
  const text = val || placeholder
  if (!text) return '<span style="border-bottom:1px dotted #666;display:block;min-height:18px;margin:2px 0 6px"></span>'
  return `<div style="white-space:pre-wrap;word-break:break-word;padding:2px 0;margin-bottom:6px">${text}</div>`
}

function generateLetterHtml(d: ScrisoareMedicalaData): string {
  const concediuLine = d.concediuStatus === 'eliberat'
    ? `${cb(true)} S-a eliberat concediu medical la externare/consultația din ambulatoriu, caz în care se va înscrie seria și numărul acestuia: <strong>${d.concediuSerie || '..............'}</strong>`
    : d.concediuStatus === 'nu_necesar'
    ? `${cb(true)} Nu s-a eliberat concediu medical la externare deoarece nu a fost necesar`
    : `${cb(true)} Nu s-a eliberat concediu medical la externare`

  const prescriptieLine = d.prescriptieStatus === 'eliberata'
    ? `${cb(true)} S-a eliberat prescripție medicală, caz în care se va înscrie seria și numărul acesteia: <strong>${d.prescriptieSerie || '..............'}</strong>`
    : d.prescriptieStatus === 'nu_necesar'
    ? `${cb(true)} Nu s-a eliberat prescripție medicală deoarece nu a fost necesar`
    : `${cb(true)} Nu s-a eliberat prescripție medicală`

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8">
  <title>Scrisoare Medicală — ${d.patientName}</title>
  <style>
    * { font-family: 'Times New Roman', Times, serif; box-sizing: border-box; }
    @page { margin: 15mm 20mm; size: A4; }
    body { font-size: 10pt; line-height: 1.5; color: #000; margin: 0; }
    h1 { text-align: center; font-size: 13pt; font-weight: bold; text-transform: uppercase; margin: 18px 0 14px; letter-spacing: 1px; }
    p { margin: 4px 0 8px; }
    .header { margin-bottom: 16px; font-size: 10pt; }
    .header p { margin: 1px 0; }
    .section-title { font-weight: bold; margin-top: 10px; margin-bottom: 2px; }
    .dotline { border-bottom: 1px dotted #555; display: block; min-height: 18px; margin: 2px 0 5px; white-space: pre-wrap; word-break: break-word; padding: 1px 0; }
    .indent { margin-left: 16px; }
    .checkbox-row { margin: 3px 0; display: block; }
    .footer-note { font-size: 8.5pt; font-weight: bold; margin-top: 16px; border-top: 1px solid #999; padding-top: 8px; }
    .signature-area { margin-top: 36px; text-align: center; }
    .transmit-section { margin-top: 10px; font-size: 9pt; }
    hr { border: none; border-top: 1px solid #999; margin: 8px 0; }
  </style>
</head>
<body>
  <div class="header">
    <p>Denumire Furnizor <span style="border-bottom:1px solid #333;display:inline-block;min-width:180px;padding:0 4px">${d.furnizorNume || ''}</span></p>
    <p>Medic <span style="border-bottom:1px solid #333;display:inline-block;min-width:220px;padding:0 4px">${d.medicNume || ''}</span></p>
    <p>Contract/convenție nr. <span style="border-bottom:1px solid #333;display:inline-block;min-width:150px;padding:0 4px">${d.contractNr || ''}</span></p>
    <p>CAS <span style="border-bottom:1px solid #333;display:inline-block;min-width:220px;padding:0 4px">${d.cas || ''}</span></p>
  </div>

  <h1>SCRISOARE MEDICALĂ<sup>*)</sup></h1>

  <p>Stimate(ă) coleg(ă), vă informăm că <strong>${d.patientName}</strong>, născut la data de
  <strong>${d.patientBirthDate || '.........'}</strong>, CNP/cod unic de asigurare <strong>${d.patientCnp || '.........'}</strong>,
  a fost consultat în serviciul nostru la data de <strong>${d.dataPrezentare || '.........'}</strong>
  nr. din Registrul de consultații <strong>${d.nrRegistru || '.........'}</strong>.</p>

  <div class="section-title">Motivele prezentării:</div>
  <span class="dotline">${d.motivePrezentare}</span>
  <span class="dotline"></span>

  <p>Pacient diagnosticat cu afecțiune oncologică &nbsp;
    <strong>${cb(d.esteOncologic)}</strong> DA &nbsp;/&nbsp;
    <strong>${cb(!d.esteOncologic)}</strong> NU
  </p>

  <div class="section-title">Diagnosticul și codul de diagnostic:</div>
  <span class="dotline">${d.diagnostic.split('\n')[0] ?? ''}</span>
  <span class="dotline">${d.diagnostic.split('\n')[1] ?? ''}</span>
  <span class="dotline">${d.diagnostic.split('\n')[2] ?? ''}</span>
  <span class="dotline">${d.diagnostic.split('\n')[3] ?? ''}</span>

  <div class="section-title">Anamneză:</div>
  ${dotLine(d.anamneza)}
  <div class="section-title indent">- factori de risc</div>
  ${dotLine(d.factoriDeRisc)}
  <span class="dotline"></span>

  <div class="section-title">Examen clinic:</div>
  <div class="indent section-title">- general</div>
  ${dotLine(d.examenClinicGeneral)}
  <div class="indent section-title">- local</div>
  ${dotLine(d.examenClinicLocal)}
  <span class="dotline"></span>

  <div class="section-title">Examene de laborator:</div>
  <div class="indent section-title">- cu valori normale</div>
  ${dotLine(d.labValoriNormale)}
  <span class="dotline"></span>
  <div class="indent section-title">- cu valori patologice</div>
  ${dotLine(d.labValoriPatologice)}
  <span class="dotline"></span>

  <div class="section-title">Examene paraclinice:</div>
  <div class="indent">EKG</div>
  ${dotLine(d.ekg)}
  <div class="indent">ECO</div>
  ${dotLine(d.eco)}
  <div class="indent">Rx</div>
  ${dotLine(d.rx)}
  <div class="indent">Altele</div>
  ${dotLine(d.alteExamene)}
  <span class="dotline"></span>

  <div class="section-title">Tratament efectuat:</div>
  ${dotLine(d.tratamentEfectuat)}
  <span class="dotline"></span>
  <span class="dotline"></span>

  <div class="section-title">Alte informații referitoare la starea de sănătate a asiguratului:</div>
  ${dotLine(d.alteInformatii)}
  <span class="dotline"></span>
  <span class="dotline"></span>

  <div class="section-title">Tratament recomandat</div>
  ${dotLine(d.tratamentRecomandat)}
  <span class="dotline"></span>
  <span class="dotline"></span>
  <span class="dotline"></span>
  <span class="dotline"></span>
  <span class="dotline"></span>

  <div class="footer-note">
    <strong>Nota:</strong> Se va specifica durata pentru care se poate prescrie de medicul din ambulatoriu, inclusiv medicul de familie, fiecare dintre medicamentele recomandate.<br>
    <strong>ATENȚIE!</strong> Nerespectarea obligației medicului de specialitate din ambulatoriul clinic de specialitate sau din spital de a iniția tratamentul prin prescrierea primei rețete pentru medicamente cu sau fără contribuție personală, astfel cum este prevăzut în protocoalele terapeutice, precum și de a elibera prescripția medicală / bilete de trimitere / concediu medical / recomandări pentru îngrijiri la domiciliu / prescripții pentru dispozitive medicale în fiecare caz pentru care este necesar, se sancționează potrivit contractului încheiat de furnizor cu casa de asigurări de sănătate!<br>
    Valabilitatea scrisorii medicale incepe de la data eliberarii acesteia. Valabilitatea este în concordanță cu protocolul terapeutic. În cazul în care medicul de specialitate nu consemnează o valabilitate pentru conduita terapeutică recomandată, valabilitatea scrisorii medicale încetează în momentul în care medicul de familie recomanda pacientului reevaluarea stării de sănătate.
  </div>

  <div style="margin-top:12px">
    <div class="section-title">Indicație de revenire pentru internare</div>
    <div class="checkbox-row">&nbsp;- ${cb(d.indicatieRevenire === 'da')} da, revine pentru internare în termen de <strong>${d.termenRevenire || '............'}</strong></div>
    <div class="checkbox-row">&nbsp;- ${cb(d.indicatieRevenire === 'nu')} nu, nu este necesară revenirea pentru internare</div>
  </div>

  <div style="margin-top:10px">
    <div>Se completează obligatoriu una dintre cele trei informații:</div>
    <div class="checkbox-row indent">&nbsp;- ${d.prescriptieStatus === 'eliberata' ? cb(true) : cb(false)} ${prescriptieLine}</div>
    <div class="checkbox-row indent">&nbsp;- ${d.prescriptieStatus === 'nu_necesar' ? cb(true) : cb(false)} Nu s-a eliberat prescripție medicală deoarece nu a fost necesar</div>
    <div class="checkbox-row indent">&nbsp;- ${d.prescriptieStatus === 'nu_eliberata' ? cb(true) : cb(false)} Nu s-a eliberat prescripție medicală</div>
  </div>

  <div style="margin-top:10px">
    <div>Se completează obligatoriu una dintre cele trei informații:</div>
    <div class="checkbox-row indent">&nbsp;- ${d.concediuStatus === 'eliberat' ? cb(true) : cb(false)} ${concediuLine}</div>
    <div class="checkbox-row indent">&nbsp;- ${d.concediuStatus === 'nu_necesar' ? cb(true) : cb(false)} Nu s-a eliberat concediu medical la externare deoarece nu a fost necesar</div>
    <div class="checkbox-row indent">&nbsp;- ${d.concediuStatus === 'nu_eliberat' ? cb(true) : cb(false)} Nu s-a eliberat concediu medical la externare</div>
  </div>

  <div style="margin-top:10px">
    <div>Se completează obligatoriu una dintre cele două informații:</div>
    <div class="checkbox-row indent">&nbsp;- ${cb(d.ingrijiriStatus === 'eliberata')} S-a eliberat recomandare pentru îngrijiri medicale la domiciliu/paliative la domiciliu</div>
    <div class="checkbox-row indent">&nbsp;- ${cb(d.ingrijiriStatus === 'nu_necesar')} Nu s-a eliberat recomandare pentru îngrijiri medicale la domiciliu/paliative la domiciliu, deoarece nu a fost necesar</div>
  </div>

  <div style="margin-top:10px">
    <div>Se completează obligatoriu una dintre cele două informații:</div>
    <div class="checkbox-row indent">&nbsp;- ${cb(d.dispozitiveStatus === 'eliberata')} S-a eliberat prescripție medicală pentru dispozitive medicale în ambulatoriu</div>
    <div class="checkbox-row indent">&nbsp;- ${cb(d.dispozitiveStatus === 'nu_necesar')} Nu s-a eliberat prescripție medicală pentru dispozitive medicale în ambulatoriu deoarece nu a fost necesar</div>
  </div>

  <div class="transmit-section">
    <div>Calea de transmitere:</div>
    <div class="indent">${cb(d.caleaTransmitere === 'asigurat')} prin asigurat</div>
    <div class="indent">${cb(d.caleaTransmitere === 'posta')} prin poștă ${d.caleaTransmitere === 'posta' && d.postaAdresa ? `— ${d.postaAdresa}` : '...................'}</div>
  </div>

  <div class="signature-area">
    <p style="text-align:left">Data <strong>${d.dataScrisorii}</strong></p>
    <div style="text-align:center;margin-top:24px">
      Semnătura și parafa medicului<br><br>
      .............................<br>
      <em>${d.medicNume}${d.medicParafa ? ` / ${d.medicParafa}` : ''}</em>
    </div>
  </div>
</body>
</html>`
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
function PreviewContent({ data }: { data: ScrisoareMedicalaData }) {
  const row = (label: string, value: string) => (
    <div style={{ marginBottom: 2 }}>
      <span style={{ fontStyle: 'italic' }}>{label}</span>{' '}
      <span style={{ borderBottom: '1px solid #333', display: 'inline-block', minWidth: 160, padding: '0 4px' }}>{value}</span>
    </div>
  )
  const dotBlock = (val: string) => (
    <div style={{ borderBottom: '1px dotted #777', minHeight: 18, marginBottom: 5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', padding: '1px 0', fontSize: '9pt' }}>
      {val}
    </div>
  )
  const checkRow = (checked: boolean, label: string) => (
    <div style={{ margin: '2px 0' }}>
      <span style={{ marginRight: 6, fontSize: '11pt' }}>{checked ? '☑' : '☐'}</span>
      {label}
    </div>
  )
  const sectionTitle = (title: string) => (
    <div style={{ fontWeight: 'bold', marginTop: 10, marginBottom: 2, fontSize: '9pt' }}>{title}</div>
  )

  const diagLines = data.diagnostic.split('\n').filter(Boolean)

  return (
    <div className={styles.previewWrapper}>
      <div className={styles.letterPage} style={{ fontFamily: '"Times New Roman", Times, serif', fontSize: '9.5pt', lineHeight: 1.5, color: '#000' }}>

        {/* Antet */}
        <div style={{ marginBottom: 16, fontSize: '9pt' }}>
          {row('Denumire Furnizor', data.furnizorNume)}
          {row('Medic', data.medicNume)}
          {row('Contract/convenție nr.', data.contractNr)}
          {row('CAS', data.cas)}
        </div>

        <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', textTransform: 'uppercase', letterSpacing: 1, margin: '16px 0 12px' }}>
          SCRISOARE MEDICALĂ<sup style={{ fontSize: '7pt' }}>*)</sup>
        </div>

        {/* Intro */}
        <p style={{ margin: '0 0 8px', textAlign: 'justify' }}>
          Stimate(ă) coleg(ă), vă informăm că <strong>{data.patientName}</strong>, născut la data de{' '}
          <strong>{data.patientBirthDate || '.........'}</strong>, CNP/cod unic de asigurare{' '}
          <strong>{data.patientCnp || '.........'}</strong>, a fost consultat în serviciul nostru la data de{' '}
          <strong>{data.dataPrezentare || '.........'}</strong> nr. din Registrul de consultații{' '}
          <strong>{data.nrRegistru || '.........'}</strong>.
        </p>

        {sectionTitle('Motivele prezentării:')}
        {dotBlock(data.motivePrezentare)}
        {dotBlock('')}

        <div style={{ margin: '6px 0' }}>
          Pacient diagnosticat cu afecțiune oncologică &nbsp;
          <strong>{data.esteOncologic ? '☑' : '☐'}</strong> DA &nbsp;/&nbsp;
          <strong>{!data.esteOncologic ? '☑' : '☐'}</strong> NU
        </div>

        {sectionTitle('Diagnosticul și codul de diagnostic:')}
        {(diagLines.length > 0 ? diagLines : ['']).map((ln, i) => <div key={i}>{dotBlock(ln)}</div>)}
        {diagLines.length < 3 && Array.from({ length: 3 - diagLines.length }).map((_, i) => <div key={`empty-${i}`}>{dotBlock('')}</div>)}

        {sectionTitle('Anamneză:')}
        {dotBlock(data.anamneza)}
        <div style={{ marginLeft: 14, fontWeight: 'bold', fontSize: '9pt' }}>- factori de risc</div>
        {dotBlock(data.factoriDeRisc)}
        {dotBlock('')}

        {sectionTitle('Examen clinic:')}
        <div style={{ marginLeft: 14, fontWeight: 'bold', fontSize: '9pt' }}>- general</div>
        {dotBlock(data.examenClinicGeneral)}
        {dotBlock('')}
        <div style={{ marginLeft: 14, fontWeight: 'bold', fontSize: '9pt' }}>- local</div>
        {dotBlock(data.examenClinicLocal)}
        {dotBlock('')}

        {sectionTitle('Examene de laborator:')}
        <div style={{ marginLeft: 14, fontWeight: 'bold', fontSize: '9pt' }}>- cu valori normale</div>
        {dotBlock(data.labValoriNormale)}
        {dotBlock('')}
        <div style={{ marginLeft: 14, fontWeight: 'bold', fontSize: '9pt' }}>- cu valori patologice</div>
        {dotBlock(data.labValoriPatologice)}
        {dotBlock('')}

        {sectionTitle('Examene paraclinice:')}
        <div style={{ marginLeft: 14, fontSize: '9pt' }}>EKG</div>{dotBlock(data.ekg)}
        <div style={{ marginLeft: 14, fontSize: '9pt' }}>ECO</div>{dotBlock(data.eco)}
        <div style={{ marginLeft: 14, fontSize: '9pt' }}>Rx</div>{dotBlock(data.rx)}
        <div style={{ marginLeft: 14, fontSize: '9pt' }}>Altele</div>{dotBlock(data.alteExamene)}
        {dotBlock('')}

        {sectionTitle('Tratament efectuat:')}
        {dotBlock(data.tratamentEfectuat)}
        {dotBlock('')}
        {dotBlock('')}

        {sectionTitle('Alte informații referitoare la starea de sănătate a asiguratului:')}
        {dotBlock(data.alteInformatii)}
        {dotBlock('')}
        {dotBlock('')}

        {sectionTitle('Tratament recomandat')}
        {dotBlock(data.tratamentRecomandat)}
        {dotBlock('')}
        {dotBlock('')}
        {dotBlock('')}
        {dotBlock('')}

        {/* Nota + Atentie */}
        <div style={{ fontSize: '8pt', fontWeight: 'bold', marginTop: 12, borderTop: '1px solid #999', paddingTop: 6 }}>
          <strong>Nota:</strong> Se va specifica durata pentru care se poate prescrie de medicul din ambulatoriu, inclusiv medicul de familie, fiecare dintre medicamentele recomandate.<br />
          <strong>ATENȚIE!</strong> Nerespectarea obligației medicului de specialitate din ambulatoriul clinic de specialitate sau din spital de a iniția tratamentul prin prescrierea primei rețete... se sancționează potrivit contractului încheiat de furnizor cu casa de asigurări de sănătate!<br />
          Valabilitatea scrisorii medicale incepe de la data eliberarii acesteia.
        </div>

        {/* Indicatie revenire */}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 'bold', fontSize: '9pt' }}>Indicație de revenire pentru internare</div>
          {checkRow(data.indicatieRevenire === 'da', `da, revine pentru internare în termen de ${data.termenRevenire || '............'}`)}
          {checkRow(data.indicatieRevenire === 'nu', 'nu, nu este necesară revenirea pentru internare')}
        </div>

        {/* Prescriptie */}
        <div style={{ marginTop: 10, fontSize: '9pt' }}>
          <div>Se completează obligatoriu una dintre cele trei informații:</div>
          <div style={{ marginLeft: 14 }}>
            {checkRow(data.prescriptieStatus === 'eliberata', `S-a eliberat prescripție medicală, seria și numărul: ${data.prescriptieSerie || '..............'}`)}
            {checkRow(data.prescriptieStatus === 'nu_necesar', 'Nu s-a eliberat prescripție medicală deoarece nu a fost necesar')}
            {checkRow(data.prescriptieStatus === 'nu_eliberata', 'Nu s-a eliberat prescripție medicală')}
          </div>
        </div>

        {/* Concediu */}
        <div style={{ marginTop: 10, fontSize: '9pt' }}>
          <div>Se completează obligatoriu una dintre cele trei informații:</div>
          <div style={{ marginLeft: 14 }}>
            {checkRow(data.concediuStatus === 'eliberat', `S-a eliberat concediu medical la externare, seria și numărul: ${data.concediuSerie || '..............'}`)}
            {checkRow(data.concediuStatus === 'nu_necesar', 'Nu s-a eliberat concediu medical la externare deoarece nu a fost necesar')}
            {checkRow(data.concediuStatus === 'nu_eliberat', 'Nu s-a eliberat concediu medical la externare')}
          </div>
        </div>

        {/* Ingrijiri */}
        <div style={{ marginTop: 10, fontSize: '9pt' }}>
          <div>Se completează obligatoriu una dintre cele două informații:</div>
          <div style={{ marginLeft: 14 }}>
            {checkRow(data.ingrijiriStatus === 'eliberata', 'S-a eliberat recomandare pentru îngrijiri medicale la domiciliu / paliative la domiciliu')}
            {checkRow(data.ingrijiriStatus === 'nu_necesar', 'Nu s-a eliberat recomandare pentru îngrijiri medicale la domiciliu / paliative la domiciliu, deoarece nu a fost necesar')}
          </div>
        </div>

        {/* Dispozitive */}
        <div style={{ marginTop: 10, fontSize: '9pt' }}>
          <div>Se completează obligatoriu una dintre cele două informații:</div>
          <div style={{ marginLeft: 14 }}>
            {checkRow(data.dispozitiveStatus === 'eliberata', 'S-a eliberat prescripție medicală pentru dispozitive medicale în ambulatoriu')}
            {checkRow(data.dispozitiveStatus === 'nu_necesar', 'Nu s-a eliberat prescripție medicală pentru dispozitive medicale în ambulatoriu deoarece nu a fost necesar')}
          </div>
        </div>

        {/* Transmitere */}
        <div style={{ marginTop: 10, fontSize: '9pt', borderTop: '1px solid #ccc', paddingTop: 4 }}>
          <div>Calea de transmitere:</div>
          <div style={{ marginLeft: 14 }}>
            {checkRow(data.caleaTransmitere === 'asigurat', 'prin asigurat')}
            {checkRow(data.caleaTransmitere === 'posta', `prin poștă ${data.caleaTransmitere === 'posta' && data.postaAdresa ? `— ${data.postaAdresa}` : '...................'}`)}
          </div>
        </div>

        {/* Semnatura */}
        <div style={{ marginTop: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: '9pt' }}>Data <strong>{data.dataScrisorii}</strong></div>
          <div style={{ textAlign: 'center', minWidth: 200, fontSize: '9pt' }}>
            Semnătura și parafa medicului<br /><br />
            .............................<br />
            <em>{data.medicNume}{data.medicParafa ? ` / ${data.medicParafa}` : ''}</em>
          </div>
        </div>

        {/* Footer note */}
        <div style={{ marginTop: 30, fontSize: '8pt', borderTop: '1px dashed #ccc', paddingTop: 6, color: '#555' }}>
          <strong>*)</strong> Scrisoarea medicală se întocmește în două exemplare, din care un exemplar rămâne la medicul care a efectuat consultația/serviciul în ambulatoriul de specialitate, iar un exemplar este transmis medicului de familie/medicului de specialitate din ambulatoriul de specialitate.
        </div>
      </div>
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────────────────────
export function ScrisoareMedicalaModal({ detail, onClose }: Props) {
  const [view, setView] = useState<'form' | 'preview'>('form')
  const [data, setData] = useState<ScrisoareMedicalaData>(() => initFromDetail(detail))
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
    const win = window.open('', '_blank', 'width=900,height=780,scrollbars=yes')
    if (!win) {
      alert('Browserul a blocat fereastra nouă. Permiteți pop-up-uri pentru acest site.')
      return
    }
    win.document.write(generateLetterHtml(data))
    win.document.close()
    // Use timeout as fallback for browsers where onload fires inconsistently
    setTimeout(() => {
      win.focus()
      win.print()
    }, 500)
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
          {view === 'preview' && <PreviewContent data={data} />}
        </div>

      </div>
    </div>
  )
}
