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

/// Cont bancar al clinicii
export interface ClinicBankAccountDto {
  id: string
  clinicId: string
  bankName: string
  iban: string
  currency: string
  isMain: boolean
  notes: string | null
  createdAt: string
  updatedAt: string | null
}

/// Adresă a clinicii (sediu social, corespondență etc.)
export interface ClinicAddressDto {
  id: string
  clinicId: string
  addressType: string
  street: string
  city: string
  county: string
  postalCode: string | null
  country: string
  isMain: boolean
  createdAt: string
  updatedAt: string | null
}

/// Dată de contact a clinicii (email, telefon, website, fax)
export interface ClinicContactDto {
  id: string
  clinicId: string
  contactType: string
  value: string
  label: string | null
  isMain: boolean
  createdAt: string
  updatedAt: string | null
}

/// Date clinică (societate comercială)
export interface ClinicDto {
  id: string
  name: string
  fiscalCode: string
  tradeRegisterNumber: string | null
  caenCodes: ClinicCaenCodeDto[]
  legalRepresentative: string | null
  contractCNAS: string | null
  logoPath: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string | null
  bankAccounts: ClinicBankAccountDto[]
  addresses: ClinicAddressDto[]
  contacts: ClinicContactDto[]
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

/// Payload actualizare clinică (date generale)
export interface UpdateClinicPayload {
  name: string
  fiscalCode: string
  tradeRegisterNumber: string | null
  caenCodeIds: string[]
  legalRepresentative: string | null
  contractCNAS: string | null
}

/// Payload creare cont bancar
export interface CreateClinicBankAccountPayload {
  bankName: string
  iban: string
  currency: string
  isMain: boolean
  notes: string | null
}

/// Payload actualizare cont bancar
export interface UpdateClinicBankAccountPayload extends CreateClinicBankAccountPayload {
  id: string
}

/// Payload creare adresă
export interface CreateClinicAddressPayload {
  addressType: string
  street: string
  city: string
  county: string
  postalCode: string | null
  country: string
  isMain: boolean
}

/// Payload actualizare adresă
export interface UpdateClinicAddressPayload extends CreateClinicAddressPayload {
  id: string
}

/// Payload creare contact
export interface CreateClinicContactPayload {
  contactType: string
  value: string
  label: string | null
  isMain: boolean
}

/// Payload actualizare contact
export interface UpdateClinicContactPayload extends CreateClinicContactPayload {
  id: string
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


