import type { ICD10SearchResult } from '../types/icd10.types'
import type { SecondaryDiagnosis } from '@/components/icd10/SecondaryDiagnosesList'
import type { ConsultationFormData } from '../schemas/consultation.schema'
import type { ConsultationDetailDto, CreateConsultationPayload } from '../types/consultation.types'
import { ANAMNESIS_FIELDS, EXAM_FIELDS, type AnamnesisField, type ExamField } from '../constants/consultationDefaults'

/** Starea selectorului ICD-10: ține în afara formularului obiecte complexe (coduri + rich-text). */
export interface DiagnosisState {
  primaryCode: ICD10SearchResult | null
  primaryDetails: string
  secondary: SecondaryDiagnosis[]
  /** Coduri vechi, salvate ca listă simplă înainte de selectorul ICD-10 */
  legacyTags: string[]
}

export const EMPTY_DIAGNOSIS: DiagnosisState = { primaryCode: null, primaryDetails: '', secondary: [], legacyTags: [] }

const parseLegacyTags = (raw: string | null): string[] => {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : [raw]
  } catch {
    return [raw]
  }
}

interface StoredDiagnosis {
  primaryCode?: ICD10SearchResult
  primaryDetails?: string
  secondaryDiagnoses?: SecondaryDiagnosis[]
}

/** Reconstruiește starea selectorului din JSON-ul salvat în `diagnostic`. */
export const parseDiagnosisState = (detail: Pick<ConsultationDetailDto, 'diagnostic' | 'diagnosticCodes'>): DiagnosisState => {
  try {
    const data = detail.diagnostic ? JSON.parse(detail.diagnostic) as StoredDiagnosis : null
    if (data?.primaryCode) {
      return {
        primaryCode: data.primaryCode,
        primaryDetails: data.primaryDetails ?? '',
        secondary: data.secondaryDiagnoses ?? [],
        // Codurile derivate din selector se recalculează la salvare; altfel ștergerea
        // diagnosticului ar lăsa în urmă codurile vechi
        legacyTags: [],
      }
    }
  } catch { /* text liber, nu JSON */ }
  return { ...EMPTY_DIAGNOSIS, legacyTags: parseLegacyTags(detail.diagnosticCodes) }
}

/**
 * `diagnostic` = JSON-ul complet al selectorului (serverul îl normalizează în
 * ConsultationDiagnoses); `diagnosticCodes` = lista plată de coduri, citită de rețete.
 */
export const buildDiagnosisFields = (diag: DiagnosisState, freeText: string | undefined) => {
  const codes = [
    ...(diag.primaryCode ? [diag.primaryCode.code] : []),
    ...diag.secondary.flatMap(sd => sd.icd10Codes.map(c => c.code)),
  ]
  const codeList = codes.length > 0 ? codes : diag.legacyTags
  return {
    diagnostic: diag.primaryCode
      ? JSON.stringify({ primaryCode: diag.primaryCode, primaryDetails: diag.primaryDetails, secondaryDiagnoses: diag.secondary })
      : freeText || null,
    diagnosticCodes: codeList.length > 0 ? JSON.stringify(codeList) : null,
  }
}

const toText = (v: string | undefined | null) => v || null
const toNum = (v: number | undefined | null) => v ?? null

export const buildAnamnesisPayload = (v: ConsultationFormData): Record<AnamnesisField, string | null> =>
  Object.fromEntries(ANAMNESIS_FIELDS.map(k => [k, toText(v[k])])) as Record<AnamnesisField, string | null>

const NUMERIC_EXAM_FIELDS = new Set<ExamField>([
  'greutate', 'inaltime', 'tensiuneSistolica', 'tensiuneDiastolica', 'puls',
  'frecventaRespiratorie', 'temperatura', 'spO2', 'glicemie',
])

export const buildExamPayload = (v: ConsultationFormData): Record<ExamField, string | number | null> =>
  Object.fromEntries(EXAM_FIELDS.map(k => [
    k,
    NUMERIC_EXAM_FIELDS.has(k) ? toNum(v[k] as number | null | undefined) : toText(v[k] as string | undefined),
  ])) as Record<ExamField, string | number | null>

/** Payload complet (header + anamneză + examen) — o singură sursă pentru create/update. */
export const buildConsultationPayload = (v: ConsultationFormData, diag: DiagnosisState): CreateConsultationPayload => ({
  patientId: v.patientId,
  doctorId: v.doctorId,
  date: v.date,
  appointmentId: v.appointmentId || null,
  ...buildAnamnesisPayload(v),
  ...(buildExamPayload(v) as Partial<CreateConsultationPayload>),
  investigatii: toText(v.investigatii),
  analizeMedicale: toText(v.analizeMedicale),
  ...buildDiagnosisFields(diag, v.diagnostic),
  recomandari: toText(v.recomandari),
  observatii: toText(v.observatii),
  concluzii: toText(v.concluzii),
  esteAfectiuneOncologica: !!v.esteAfectiuneOncologica,
  areIndicatieInternare: !!v.areIndicatieInternare,
  saEliberatPrescriptie: !!v.saEliberatPrescriptie,
  seriePrescriptie: toText(v.seriePrescriptie),
  saEliberatConcediuMedical: !!v.saEliberatConcediuMedical,
  serieConcediuMedical: toText(v.serieConcediuMedical),
  saEliberatIngrijiriDomiciliu: !!v.saEliberatIngrijiriDomiciliu,
  saEliberatDispozitiveMedicale: !!v.saEliberatDispozitiveMedicale,
  dataUrmatoareiVizite: toText(v.dataUrmatoareiVizite),
  noteUrmatoareaVizita: toText(v.noteUrmatoareaVizita),
})
