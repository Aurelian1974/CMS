/// Tipuri pentru feature-ul Consultații

export interface ConsultationListDto {
  id: string
  clinicId: string
  patientId: string
  patientName: string
  patientPhone: string | null
  doctorId: string
  doctorName: string
  specialtyName: string | null
  date: string
  diagnostic: string | null
  diagnosticCodes: string | null
  statusId: string
  statusName: string
  statusCode: string
  isDeleted: boolean
  createdAt: string
  createdByName: string | null
}

export interface ConsultationDetailDto extends ConsultationListDto {
  patientCnp: string | null
  patientEmail: string | null
  patientBirthDate: string | null
  patientGender: string | null
  doctorMedicalCode: string | null
  appointmentId: string | null
  // Tab 1: Anamneză
  motiv: string | null
  istoricMedicalPersonal: string | null
  tratamentAnterior: string | null
  istoricBoalaActuala: string | null
  istoricFamilial: string | null
  factoriDeRisc: string | null
  alergiiConsultatie: string | null
  // Tab 2: Examen Clinic
  stareGenerala: string | null
  tegumente: string | null
  mucoase: string | null
  greutate: number | null
  inaltime: number | null
  tensiuneSistolica: number | null
  tensiuneDiastolica: number | null
  puls: number | null
  frecventaRespiratorie: number | null
  temperatura: number | null
  spO2: number | null
  edeme: string | null
  glicemie: number | null
  ganglioniLimfatici: string | null
  examenClinic: string | null
  alteObservatiiClinice: string | null
  // Tab 3: Investigații
  investigatii: string | null
  // Tab 4: Analize Medicale
  analizeMedicale: string | null
  // Tab 5: Diagnostic & Tratament
  recomandari: string | null
  observatii: string | null
  // Tab 6: Concluzii
  concluzii: string | null
  esteAfectiuneOncologica: boolean
  areIndicatieInternare: boolean
  saEliberatPrescriptie: boolean
  seriePrescriptie: string | null
  saEliberatConcediuMedical: boolean
  serieConcediuMedical: string | null
  saEliberatIngrijiriDomiciliu: boolean
  saEliberatDispozitiveMedicale: boolean
  dataUrmatoareiVizite: string | null
  noteUrmatoareaVizita: string | null
  updatedAt: string | null
  updatedBy: string | null
  updatedByName: string | null
}

export interface ConsultationStatsDto {
  totalConsultations: number
  draftCount: number
  completedCount: number
  lockedCount: number
}

export interface ConsultationsPagedResponse {
  pagedResult: {
    items: ConsultationListDto[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  stats: ConsultationStatsDto
}

export interface GetConsultationsParams {
  page: number
  pageSize: number
  search?: string
  doctorId?: string
  statusId?: string
  dateFrom?: string
  dateTo?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface CreateConsultationPayload {
  patientId: string
  doctorId: string
  appointmentId?: string | null
  date: string
  // Tab 1
  motiv?: string | null
  istoricMedicalPersonal?: string | null
  tratamentAnterior?: string | null
  istoricBoalaActuala?: string | null
  istoricFamilial?: string | null
  factoriDeRisc?: string | null
  alergiiConsultatie?: string | null
  // Tab 2
  stareGenerala?: string | null
  tegumente?: string | null
  mucoase?: string | null
  greutate?: number | null
  inaltime?: number | null
  tensiuneSistolica?: number | null
  tensiuneDiastolica?: number | null
  puls?: number | null
  frecventaRespiratorie?: number | null
  temperatura?: number | null
  spO2?: number | null
  edeme?: string | null
  glicemie?: number | null
  ganglioniLimfatici?: string | null
  examenClinic?: string | null
  alteObservatiiClinice?: string | null
  // Tab 3
  investigatii?: string | null
  // Tab 4
  analizeMedicale?: string | null
  // Tab 5
  diagnostic?: string | null
  diagnosticCodes?: string | null
  recomandari?: string | null
  observatii?: string | null
  // Tab 6
  concluzii?: string | null
  esteAfectiuneOncologica?: boolean
  areIndicatieInternare?: boolean
  saEliberatPrescriptie?: boolean
  seriePrescriptie?: string | null
  saEliberatConcediuMedical?: boolean
  serieConcediuMedical?: string | null
  saEliberatIngrijiriDomiciliu?: boolean
  saEliberatDispozitiveMedicale?: boolean
  dataUrmatoareiVizite?: string | null
  noteUrmatoareaVizita?: string | null
  statusId?: string | null
}

export interface UpdateConsultationPayload extends CreateConsultationPayload {
  id: string
}

export type ConsultationStatusFilter = 'all' | 'draft' | 'completed' | 'locked'
