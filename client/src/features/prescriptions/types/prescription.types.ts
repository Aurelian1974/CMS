import type { components } from '@/api/generated/schema'

type Schemas = components['schemas']

// OpenAPI marchează toate câmpurile ca opționale și string-urile ca nullable;
// API-ul le returnează mereu, iar cele de mai jos nu sunt niciodată null (NOT NULL în BD)
type WithRequired<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> }
type LookupKeys = 'code' | 'name'

export type PrescriptionListDto = WithRequired<Required<Schemas['PrescriptionListDto']>,
  'typeCode' | 'typeName' | 'statusCode' | 'statusName' | 'patientName' | 'doctorName'>
export type PrescriptionItemDto = WithRequired<Required<Schemas['PrescriptionItemDto']>, 'drugName'>
export type PrescriptionDetailDto = WithRequired<Required<Omit<Schemas['PrescriptionDetailDto'], 'items'>>,
  'clinicName' | 'typeCode' | 'typeName' | 'statusCode' | 'statusName' | 'patientName' | 'doctorName'>
  & { items: PrescriptionItemDto[] }
export type PrescriptionStatsDto = Required<Schemas['PrescriptionStatsDto']>

export type PrescriptionTypeLookupDto = WithRequired<Required<Schemas['PrescriptionTypeLookupDto']>, LookupKeys>
export type PrescriptionLookupItemDto = WithRequired<Required<Schemas['PrescriptionLookupItemDto']>, LookupKeys>
export type PrescriptionCareTypeLookupDto = WithRequired<Required<Schemas['PrescriptionCareTypeLookupDto']>, LookupKeys>

export interface PrescriptionLookupsDto {
  types: PrescriptionTypeLookupDto[]
  statuses: PrescriptionLookupItemDto[]
  careTypes: PrescriptionCareTypeLookupDto[]
  insuredCategories: PrescriptionLookupItemDto[]
}

export interface PrescriptionsPagedResponse {
  pagedResult: {
    items: PrescriptionListDto[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  stats: PrescriptionStatsDto
}

export type PrescriptionItemData = Required<Schemas['PrescriptionItemData']>

export type CreatePrescriptionsPayload =
  Required<Omit<Schemas['CreatePrescriptionsCommand'], 'items'>> & { items: PrescriptionItemData[] }

export type UpdatePrescriptionPayload =
  { id: string } & Required<Omit<Schemas['UpdatePrescriptionRequest'], 'items'>> & { items: PrescriptionItemData[] }

export type GenerateConsultationPrescriptionsPayload =
  { consultationId: string } & Required<Schemas['GenerateConsultationPrescriptionsRequest']>

export interface CancelPrescriptionPayload {
  id: string
  reason: string
}

export interface GetPrescriptionsParams {
  search?: string
  prescriptionTypeId?: string
  statusId?: string
  doctorId?: string
  patientId?: string
  dateFrom?: string
  dateTo?: string
  page: number
  pageSize: number
  sortBy: string
  sortDir: 'asc' | 'desc'
}

/** Filtrul rapid pe tipul rețetei din bara de căutare. */
export type PrescriptionKindFilter = 'all' | 'compensated' | 'simple'

/** Codurile statusurilor (seed în migrarea 0051) — identificatori stabili, nu etichete. */
export const PRESCRIPTION_STATUS = {
  Draft: 'CIORNA',
  Issued: 'EMISA',
  Transmitted: 'TRANSMISA',
  Dispensed: 'ELIBERATA',
  Cancelled: 'ANULATA',
} as const
