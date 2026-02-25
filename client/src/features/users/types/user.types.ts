/// DTO listare utilizatori — include rol, doctor/staff asociat
export interface UserDto {
  id: string
  clinicId: string
  roleId: string
  roleName: string
  roleCode: string
  doctorId: string | null
  doctorName: string | null
  medicalStaffId: string | null
  medicalStaffName: string | null
  username: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
  lastLoginAt: string | null
  createdAt: string
}

/// DTO detalii utilizator — include + audit + lockout
export interface UserDetailDto extends UserDto {
  failedLoginAttempts: number
  lockoutEnd: string | null
  updatedAt: string | null
}

/// Parametri query listare paginată
export interface GetUsersParams {
  page: number
  pageSize: number
  search?: string
  roleId?: string
  isActive?: boolean
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

/// Rezultat paginat
export interface UsersPagedResult {
  items: UserDto[]
  totalCount: number
  page: number
  pageSize: number
}

/// Payload creare utilizator
export interface CreateUserPayload {
  roleId: string
  doctorId: string | null
  medicalStaffId: string | null
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  isActive: boolean
}

/// Payload actualizare utilizator (fără parolă)
export interface UpdateUserPayload {
  id: string
  roleId: string
  doctorId: string | null
  medicalStaffId: string | null
  username: string
  email: string
  firstName: string
  lastName: string
  isActive: boolean
}

/// Payload schimbare parolă
export interface ChangePasswordPayload {
  newPassword: string
}

/// Tipul asocierii: doctor sau personal medical
export type UserAssociationType = 'doctor' | 'medicalStaff'

/// DTO rol (nomenclator)
export interface RoleDto {
  id: string
  name: string
  code: string
  isActive: boolean
}
