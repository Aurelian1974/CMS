/// DTO listare personal medical — include denumirile relațiilor
export interface MedicalStaffDto {
  id: string
  clinicId: string
  departmentId: string | null
  departmentName: string | null
  supervisorDoctorId: string | null
  supervisorName: string | null
  medicalTitleId: string | null
  medicalTitleName: string | null
  firstName: string
  lastName: string
  fullName: string
  email: string
  phoneNumber: string | null
  isActive: boolean
  createdAt: string
}

/// DTO simplificat pentru dropdown-uri și listare per departament
export interface MedicalStaffLookupDto {
  id: string
  fullName: string
  firstName: string
  lastName: string
  email: string | null
  departmentId: string | null
  departmentName: string | null
  medicalTitleId: string | null
  medicalTitleName: string | null
}

/// DTO detalii personal medical — include + updatedAt
export interface MedicalStaffDetailDto extends MedicalStaffDto {
  updatedAt: string | null
}

/// Parametri query listare paginată
export interface GetMedicalStaffParams {
  page: number
  pageSize: number
  search?: string
  departmentId?: string
  medicalTitleId?: string
  isActive?: boolean
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

/// Rezultat paginat
export interface MedicalStaffPagedResult {
  items: MedicalStaffDto[]
  totalCount: number
  page: number
  pageSize: number
}

/// Payload creare personal medical
export interface CreateMedicalStaffPayload {
  departmentId: string | null
  supervisorDoctorId: string | null
  medicalTitleId: string | null
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
}

/// Payload actualizare personal medical
export interface UpdateMedicalStaffPayload extends CreateMedicalStaffPayload {
  id: string
  isActive: boolean
}

/// Filtru status
export type MedicalStaffStatusFilter = 'all' | 'active' | 'inactive'
