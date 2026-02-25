/// Tipuri pentru titulaturi medicale — sincronizate cu MedicalTitleDto din backend

/// Titulatură medicală (din API GetAll)
export interface MedicalTitleDto {
  id: string
  name: string
  code: string
  description: string | null
  displayOrder: number
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

/// Payload creare titulatură
export interface CreateMedicalTitlePayload {
  name: string
  code: string
  description: string | null
  displayOrder: number
}

/// Payload actualizare titulatură
export interface UpdateMedicalTitlePayload extends CreateMedicalTitlePayload {
  id: string
}

/// Payload toggle activ/inactiv
export interface ToggleMedicalTitlePayload {
  isActive: boolean
}
