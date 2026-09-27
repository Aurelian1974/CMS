import type { components } from '@/api/generated/schema'
import type { ApiDto, PagedResponse } from '@/types/common.types'

type Schemas = components['schemas']

export type InvoiceListDto = ApiDto<Schemas['InvoiceListDto'], 'originalInvoiceId' | 'customerFiscalCode'>
export type InvoiceStatsDto = ApiDto<Schemas['InvoiceStatsDto']>

export interface InvoicesPagedResponse {
  pagedResult: PagedResponse<InvoiceListDto>
  stats: InvoiceStatsDto
}

export type InvoiceLineDto = ApiDto<Schemas['InvoiceLineDto'], 'code' | 'vatExemptionReasonCode' | 'vatExemptionReasonText'>

export type InvoiceDetailDto = ApiDto<Omit<Schemas['InvoiceDetailDto'], 'lines'>,
  | 'originalInvoiceId' | 'originalSeries' | 'originalNumber' | 'originalIssueDate' | 'stornoReason'
  | 'stornoInvoiceId' | 'stornoSeries' | 'stornoNumber'
  | 'supplierTradeRegisterNumber' | 'supplierAddress' | 'supplierCity' | 'supplierCounty'
  | 'supplierBankName' | 'supplierBankAccount'
  | 'customerCnp' | 'customerFiscalCode' | 'customerTradeRegisterNumber'
  | 'customerAddress' | 'customerCity' | 'customerCounty'
  | 'notes' | 'createdByName'> & { lines: InvoiceLineDto[] }

export type CreateInvoiceResult = ApiDto<Schemas['CreateInvoiceResult']>

/** Filtrul rapid din lista de facturi. */
export type InvoiceStatusFilter = 'all' | 'issued' | 'reversed'

export interface GetInvoicesParams {
  search?: string
  statusId?: string
  dateFrom?: string
  dateTo?: string
  page: number
  pageSize: number
  sortBy: string
  sortDir: 'asc' | 'desc'
}

export interface InvoiceLineInput {
  medicalServiceId: string | null
  code: string | null
  name: string
  unitPrice: number
  quantity: number
  vatRateId: string
}

export interface CreateInvoicePayload {
  consultationId: string
  idempotencyKey: string
  seriesId: string | null
  customerIsLegalEntity: boolean
  customerName: string
  includeCnp: boolean
  customerFiscalCode: string | null
  customerTradeRegisterNumber: string | null
  customerAddress: string | null
  customerCity: string | null
  customerCounty: string | null
  /** Doar pentru factura de corecție după storno; altfel liniile vin din consultație. */
  lines: InvoiceLineInput[] | null
}

export interface StornoInvoicePayload {
  id: string
  idempotencyKey: string
  reason: string
}
