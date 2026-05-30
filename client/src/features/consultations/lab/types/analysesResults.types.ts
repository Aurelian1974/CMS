// Tipuri pentru modulul Buletine Analize (AnalysesResults)

export interface AnalysesResultListDto {
  id: string
  clinicId: string
  patientId: string
  patientName: string
  consultationId: string | null
  laboratory: string | null
  bulletinNumber: string | null
  collectionDate: string   // 'YYYY-MM-DD'
  resultDate: string       // 'YYYY-MM-DD'
  doctorName: string | null
  createdAt: string
  createdBy: string
}

export interface AnalysesResultDetailRowDto {
  id: string
  resultId: string
  section: string
  testName: string
  value: string
  unit: string | null
  referenceRange: string | null
  refMin: number | null
  refMax: number | null
  flag: string | null   // null / HIGH / LOW / CHECK
  method: string | null
  notes: string | null
  sortOrder: number
}

export interface AnalysesResultDetailDto extends AnalysesResultListDto {
  updatedAt: string | null
  updatedBy: string | null
  details: AnalysesResultDetailRowDto[]
}

export interface AnalysesResultsByPatientResponse {
  headers: AnalysesResultListDto[]
  details: AnalysesResultDetailRowDto[]
}

export interface AnalysesResultDetailInput {
  section: string
  testName: string
  value: string
  unit: string | null
  referenceRange: string | null
  refMin: number | null
  refMax: number | null
  flag: string | null
  method: string | null
  notes: string | null
}

export interface CreateAnalysesResultPayload {
  patientId: string
  consultationId: string | null
  laboratory: string | null
  bulletinNumber: string | null
  collectionDate: string   // 'YYYY-MM-DD'
  resultDate: string | null
  doctorName: string | null
  details: AnalysesResultDetailInput[]
}

export interface UpdateAnalysesResultPayload {
  laboratory: string | null
  bulletinNumber: string | null
  collectionDate: string   // 'YYYY-MM-DD'
  resultDate: string | null
  doctorName: string | null
  details: AnalysesResultDetailInput[]
}
