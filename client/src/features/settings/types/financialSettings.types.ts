import type { components } from '@/api/generated/schema'
import type { ApiDto } from '@/types/common.types'

type Schemas = components['schemas']

export type FiscalVatMappingDto = ApiDto<Schemas['FiscalVatMappingDto'], 'taxGroup'>
export type FiscalPaymentMappingDto = ApiDto<Schemas['FiscalPaymentMappingDto'], 'devicePaymentCode'>

export type FiscalSettingsDto = ApiDto<Omit<Schemas['FiscalSettingsDto'], 'vatMappings' | 'paymentMappings'>, 'updatedAt'> & {
  vatMappings: FiscalVatMappingDto[]
  paymentMappings: FiscalPaymentMappingDto[]
}

export type InvoiceSeriesDto = ApiDto<Schemas['InvoiceSeriesDto']>

export interface UpdateFiscalSettingsPayload {
  isEnabled: boolean
  bridgeUrl: string
  isVatPayer: boolean
  vatMappings: { vatRateId: string; taxGroup: string }[]
  paymentMappings: { paymentMethodId: string; devicePaymentCode: string }[]
}

export interface CreateInvoiceSeriesPayload {
  series: string
  startNumber: number
  isDefault: boolean
}

export interface UpdateInvoiceSeriesPayload {
  id: string
  isDefault: boolean
  isActive: boolean
}
