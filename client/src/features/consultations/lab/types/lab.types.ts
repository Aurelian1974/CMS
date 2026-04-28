// Tipuri pentru modulul Analize Medicale (Lab)

// ── Parsare PDF (alignment cu LabParseResultDto / LabResultRowDto) ─────────
export interface LabParseResultDto {
  laboratory: string | null
  bulletinNumber: string | null
  collectionDate: string | null
  resultDate: string | null
  patientName: string | null
  doctor: string | null
  results: LabResultRowDto[]
  rawText: string | null
  isScannedPdf: boolean
  parseWarning: string | null
}

export interface LabResultRowDto {
  section: string
  testName: string
  value: string
  unit: string | null
  referenceRange: string | null
  refMin: number | null
  refMax: number | null
  flag: string | null     // null / HIGH / LOW / CHECK
  method: string | null
  notes: string | null
}

// ── Salvarea în DB se face prin investigations API cu type='LabResults' ────
export interface LabBulletinPayload {
  laboratory: string | null
  bulletinNumber: string | null
  collectionDate: string | null
  resultDate: string | null
  patientName: string | null
  doctor: string | null
  results: LabResultRowDto[]
}

// ── Recomandate ─────────────────────────────────────────────────────────────
export type AnalysisPriority = 0 | 1 | 2 | 3   // Low / Normal / High / Urgent
export type RecommendedAnalysisStatus = 0 | 1 | 2  // Pending / Done / Cancelled

export interface RecommendedAnalysisDto {
  id: string
  clinicId: string
  consultationId: string
  patientId: string
  analysisId: string
  analysisName: string
  analysisCategory: string | null
  analysisSubcategory: string | null
  priority: AnalysisPriority
  notes: string | null
  status: RecommendedAnalysisStatus
  createdAt: string
  createdBy: string
  updatedAt: string | null
  updatedBy: string | null
}

export interface AnalysisDictionaryDto {
  id: string
  name: string
  category: string | null
  subcategory: string | null
  slug: string | null
}

export interface CreateRecommendedAnalysisPayload {
  consultationId: string
  patientId: string
  analysisId: string
  priority: AnalysisPriority
  notes: string | null
  status: RecommendedAnalysisStatus
}

export interface UpdateRecommendedAnalysisPayload {
  id: string
  priority: AnalysisPriority
  notes: string | null
  status: RecommendedAnalysisStatus
}

export const PRIORITY_LABELS: Record<AnalysisPriority, string> = {
  0: 'Scăzută',
  1: 'Normală',
  2: 'Ridicată',
  3: 'Urgent',
}

export const STATUS_LABELS: Record<RecommendedAnalysisStatus, string> = {
  0: 'În așteptare',
  1: 'Efectuată',
  2: 'Anulată',
}
