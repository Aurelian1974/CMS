/// DTO listare pacient — include câmpuri compute din SP
export interface PatientDto {
  id: string
  clinicId: string
  patientCode: string | null
  firstName: string
  lastName: string
  fullName: string
  cnp: string
  birthDate: string | null
  age: number | null
  genderId: string | null
  genderName: string | null
  bloodTypeId: string | null
  bloodTypeName: string | null
  phoneNumber: string | null
  email: string | null
  address: string | null
  insuranceNumber: string | null
  insuranceExpiry: string | null
  allergyCount: number
  maxAllergySeverityCode: string | null
  primaryDoctorName: string | null
  isActive: boolean
  createdAt: string
}

/// DTO detalii pacient (fără sub-colecții)
export interface PatientDetailDto extends PatientDto {
  secondaryPhone: string | null
  city: string | null
  county: string | null
  postalCode: string | null
  isInsured: boolean
  chronicDiseases: string | null
  familyDoctorName: string | null
  notes: string | null
  totalVisits: number
  createdBy: string
  createdByName: string | null
  updatedAt: string | null
  updatedBy: string | null
  updatedByName: string | null
}

/// Alergie pacient
export interface PatientAllergyDto {
  id: string
  allergyTypeId: string
  allergyTypeName: string
  allergyTypeCode: string
  allergySeverityId: string
  allergySeverityName: string
  allergySeverityCode: string
  allergenName: string
  reaction: string | null
  onsetDate: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
}

/// Doctor pacient (many-to-many)
export interface PatientDoctorDto {
  id: string
  doctorId: string
  doctorName: string
  doctorEmail: string | null
  doctorPhone: string | null
  doctorMedicalCode: string | null
  doctorSpecialtyName: string | null
  isPrimary: boolean
  assignedAt: string
  notes: string | null
  isActive: boolean
}

/// Contact de urgență
export interface PatientEmergencyContactDto {
  id: string
  fullName: string
  relationship: string | null
  phoneNumber: string
  isDefault: boolean
  notes: string | null
  isActive: boolean
}

/// Statistici pacienți (result set 3 din SP GetPaged)
export interface PatientStatsDto {
  totalPatients: number
  activePatients: number
  patientsWithAllergies: number
  newThisMonth: number
}

/// Răspuns complet detalii pacient cu sub-colecții
export interface PatientFullDetailDto {
  patient: PatientDetailDto
  allergies: PatientAllergyDto[]
  doctors: PatientDoctorDto[]
  emergencyContacts: PatientEmergencyContactDto[]
}

/// Răspuns listare paginată cu statistici
export interface PatientsPagedResponse {
  pagedResult: {
    items: PatientDto[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  stats: PatientStatsDto
}

/// Parametri query listare pacienți
export interface GetPatientsParams {
  page: number
  pageSize: number
  search?: string
  genderId?: string
  doctorId?: string
  hasAllergies?: boolean
  isActive?: boolean
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

/// Payload sync alergie (sub-colecție comandă creare/editare)
export interface SyncAllergyPayload {
  allergyTypeId: string
  allergySeverityId: string
  allergenName: string
  notes?: string | null
}

/// Payload sync doctor (sub-colecție)
export interface SyncDoctorPayload {
  doctorId: string
  isPrimary: boolean
}

/// Payload sync contact urgență (sub-colecție)
export interface SyncEmergencyContactPayload {
  fullName: string
  relationship?: string | null
  phoneNumber: string
  isDefault: boolean
}

/// Payload creare pacient
export interface CreatePatientPayload {
  firstName: string
  lastName: string
  cnp: string
  birthDate?: string | null
  genderId?: string | null
  bloodTypeId?: string | null
  phoneNumber?: string | null
  secondaryPhone?: string | null
  email?: string | null
  address?: string | null
  city?: string | null
  county?: string | null
  postalCode?: string | null
  insuranceNumber?: string | null
  insuranceExpiry?: string | null
  isInsured?: boolean
  chronicDiseases?: string | null
  familyDoctorName?: string | null
  notes?: string | null
  allergies?: SyncAllergyPayload[]
  doctors?: SyncDoctorPayload[]
  emergencyContacts?: SyncEmergencyContactPayload[]
}

/// Payload actualizare pacient
export interface UpdatePatientPayload extends CreatePatientPayload {
  id: string
  isActive: boolean
}

/// Filtru status
export type PatientStatusFilter = 'all' | 'active' | 'inactive'
