/// DTO listare doctor — include denumirile relațiilor
export interface DoctorDto {
  id: string
  clinicId: string
  departmentId: string | null
  departmentName: string | null
  supervisorDoctorId: string | null
  supervisorName: string | null
  specialtyId: string | null
  specialtyName: string | null
  subspecialtyId: string | null
  subspecialtyName: string | null
  medicalTitleId: string | null
  medicalTitleName: string | null
  firstName: string
  lastName: string
  fullName: string
  email: string
  phoneNumber: string | null
  medicalCode: string | null       // parafa medicală
  licenseNumber: string | null     // număr CMR
  licenseExpiresAt: string | null  // dată expirare aviz CMR
  isActive: boolean
  createdAt: string
}

/// DTO detalii doctor — include + updatedAt
export interface DoctorDetailDto extends DoctorDto {
  updatedAt: string | null
}

/// DTO simplificat pentru dropdown-uri (selectare doctor)
export interface DoctorLookupDto {
  id: string
  fullName: string
  firstName: string
  lastName: string
  email: string | null
  medicalCode: string | null
  specialtyId: string | null
  specialtyName: string | null
  departmentId: string | null
  departmentName: string | null
}

/// Parametri query listare paginată
export interface GetDoctorsParams {
  page: number
  pageSize: number
  search?: string
  specialtyId?: string
  departmentId?: string
  isActive?: boolean
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

/// Rezultat paginat
export interface DoctorsPagedResult {
  items: DoctorDto[]
  totalCount: number
  page: number
  pageSize: number
}

/// Payload creare doctor
export interface CreateDoctorPayload {
  departmentId: string | null
  supervisorDoctorId: string | null
  specialtyId: string | null
  subspecialtyId: string | null
  medicalTitleId: string | null
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  medicalCode: string | null
  licenseNumber: string | null
  licenseExpiresAt: string | null
}

/// Payload actualizare doctor
export interface UpdateDoctorPayload extends CreateDoctorPayload {
  id: string
  isActive: boolean
}

/// Filtru status
export type DoctorStatusFilter = 'all' | 'active' | 'inactive'
