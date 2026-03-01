/// Tipuri pentru clinici — sincronizate cu DTO-urile backend

/// Cod CAEN asociat clinicii (din ClinicCaenCodes + CaenCodes)
export interface ClinicCaenCodeDto {
  id: string          // ClinicCaenCodes.Id (junction table)
  caenCodeId: string  // CaenCodes.Id
  code: string
  name: string
  level: number
  isPrimary: boolean
}

/// Date clinică (societate comercială)
export interface ClinicDto {
  id: string
  name: string
  fiscalCode: string
  tradeRegisterNumber: string | null
  caenCodes: ClinicCaenCodeDto[]   // listă coduri CAEN (poate fi goală)
  legalRepresentative: string | null
  contractCNAS: string | null
  address: string
  city: string
  county: string
  postalCode: string | null
  bankName: string | null
  bankAccount: string | null
  email: string | null
  phoneNumber: string | null
  website: string | null
  logoPath: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

/// Locație fizică a clinicii
export interface ClinicLocationDto {
  id: string
  clinicId: string
  name: string
  address: string
  city: string
  county: string
  postalCode: string | null
  phoneNumber: string | null
  email: string | null
  isPrimary: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

/// Payload actualizare clinică
export interface UpdateClinicPayload {
  name: string
  fiscalCode: string
  tradeRegisterNumber: string | null
  caenCodeIds: string[]   // ID-urile UUID ale codurilor CAEN (CaenCodes.Id)
  legalRepresentative: string | null
  contractCNAS: string | null
  address: string
  city: string
  county: string
  postalCode: string | null
  bankName: string | null
  bankAccount: string | null
  email: string | null
  phoneNumber: string | null
  website: string | null
}

/// Payload creare locație
export interface CreateClinicLocationPayload {
  name: string
  address: string
  city: string
  county: string
  postalCode: string | null
  phoneNumber: string | null
  email: string | null
  isPrimary: boolean
}

/// Payload actualizare locație
export interface UpdateClinicLocationPayload extends CreateClinicLocationPayload {
  id: string
}
