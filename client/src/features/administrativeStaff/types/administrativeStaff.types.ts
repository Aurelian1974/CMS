/// DTO listare personal administrativ
export interface AdministrativeStaffDto {
  id: string
  clinicId: string
  departmentId: string | null
  departmentName: string | null
  positionId: string | null
  positionName: string | null
  firstName: string
  lastName: string
  fullName: string
  email: string
  phoneNumber: string | null
  isActive: boolean
  createdAt: string
}

/// DTO detalii personal administrativ
export interface AdministrativeStaffDetailDto extends AdministrativeStaffDto {
  updatedAt: string | null
}

/// DTO simplificat pentru dropdown-uri (asociere cont utilizator)
export interface AdministrativeStaffLookupDto {
  id: string
  fullName: string
  firstName: string
  lastName: string
  email: string | null
  departmentId: string | null
  departmentName: string | null
  positionId: string | null
  positionName: string | null
}

/// Funcție administrativă (nomenclator)
export interface AdministrativePositionDto {
  id: string
  name: string
  code: string
  sortOrder: number
  isActive: boolean
}

/// Parametri query listare paginată
export interface GetAdministrativeStaffParams {
  page: number
  pageSize: number
  search?: string
  departmentId?: string
  positionId?: string
  isActive?: boolean
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

/// Rezultat paginat
export interface AdministrativeStaffPagedResult {
  items: AdministrativeStaffDto[]
  totalCount: number
  page: number
  pageSize: number
}

/// Payload creare
export interface CreateAdministrativeStaffPayload {
  departmentId: string | null
  positionId: string | null
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
}

/// Payload actualizare
export interface UpdateAdministrativeStaffPayload extends CreateAdministrativeStaffPayload {
  id: string
  isActive: boolean
}

/// Filtru status
export type AdministrativeStaffStatusFilter = 'all' | 'active' | 'inactive'
