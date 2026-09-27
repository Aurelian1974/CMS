import type { components } from '@/api/generated/schema'

type Schemas = components['schemas']

// OpenAPI marchează toate câmpurile ca opționale; cele de mai jos vin mereu de la API (NOT NULL în BD)
type WithRequired<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> }

export type MedicalServiceListDto = WithRequired<Required<Schemas['MedicalServiceListDto']>,
  'code' | 'name' | 'categoryName' | 'categoryCode'>
export type MedicalServiceStatsDto = Required<Schemas['MedicalServiceStatsDto']>
export type MedicalServicePriceDto = WithRequired<Required<Schemas['MedicalServicePriceDto']>, 'vatRateName'>
export type MedicalServiceDetailDto = WithRequired<Required<Omit<Schemas['MedicalServiceDetailDto'], 'prices'>>,
  'code' | 'name' | 'categoryName' | 'rowVersion'> & { prices: MedicalServicePriceDto[] }

export type ServiceCategoryDto = WithRequired<Required<Schemas['ServiceCategoryDto']>, 'code' | 'name'>
export type VatRateDto = WithRequired<Required<Schemas['VatRateDto']>, 'code' | 'name' | 'ublCategoryCode'>
export type PaymentMethodDto = WithRequired<Required<Schemas['PaymentMethodDto']>, 'code' | 'name'>
export type InvoiceSeriesLookupDto = WithRequired<Required<Schemas['InvoiceSeriesLookupDto']>, 'series'>

export interface BillingLookupsDto {
  serviceCategories: ServiceCategoryDto[]
  vatRates: VatRateDto[]
  paymentMethods: PaymentMethodDto[]
  invoiceSeries: InvoiceSeriesLookupDto[]
}

export interface MedicalServicesPagedResponse {
  pagedResult: {
    items: MedicalServiceListDto[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
    hasPreviousPage: boolean
    hasNextPage: boolean
  }
  stats: MedicalServiceStatsDto
}

export interface GetMedicalServicesParams {
  search?: string
  categoryId?: string
  isActive?: boolean
  page: number
  pageSize: number
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export type CreateMedicalServicePayload = Required<Schemas['CreateMedicalServiceCommand']>
export type UpdateMedicalServicePayload = { id: string } & Required<Schemas['UpdateMedicalServiceRequest']>
export type AddMedicalServicePricePayload = { id: string } & Required<Schemas['AddMedicalServicePriceRequest']>

export type CreateVatRatePayload = Required<Schemas['CreateVatRateCommand']>
export type UpdateVatRatePayload = { id: string } & Required<Schemas['UpdateVatRateRequest']>

/** Filtrul rapid activ / inactiv din bara de căutare. */
export type ActiveFilter = 'all' | 'active' | 'inactive'
