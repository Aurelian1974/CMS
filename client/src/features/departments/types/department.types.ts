/// Tipuri pentru departamente — sincronizate cu DTO-urile backend

/// Date departament
export interface DepartmentDto {
  id: string
  clinicId: string
  locationId: string
  locationName: string
  name: string
  code: string
  description: string | null
  headDoctorId: string | null
  headDoctorName: string | null
  doctorCount: number
  medicalStaffCount: number
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

/// Payload creare departament
export interface CreateDepartmentPayload {
  locationId: string
  name: string
  code: string
  description: string | null
}

/// Payload actualizare departament
export interface UpdateDepartmentPayload {
  id: string
  locationId: string
  name: string
  code: string
  description: string | null
  headDoctorId: string | null
  isActive: boolean
}
