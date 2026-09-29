import type { components } from '@/api/generated/schema'
import type { ApiDto, PagedResponse } from '@/types/common.types'

type Schemas = components['schemas']

// ── Linii de servicii pe consultație ────────────────────────────────────────
export type ConsultationServiceDto = ApiDto<Schemas['ConsultationServiceDto'], 'consultationInvestigationId'>

/** Investigație efectuată fără linie de serviciu — motivul vine din ConsultationService_GetUnbilledInvestigations. */
export type UnbilledInvestigationDto = ApiDto<Schemas['UnbilledInvestigationDto'], 'serviceCode'>

export interface ConsultationServicesResponse {
  lines: ConsultationServiceDto[]
  total: number
  unbilledInvestigations: UnbilledInvestigationDto[]
}

// ── Plăți ───────────────────────────────────────────────────────────────────
export type PaymentTenderDto = ApiDto<Schemas['PaymentTenderDto']>
export type PaymentDto = ApiDto<Omit<Schemas['PaymentDto'], 'tenders'>,
  'notes' | 'cancelReason' | 'cancelledAt' | 'operatorName' | 'fiscalReceiptId'> & { tenders: PaymentTenderDto[] }

export type CreatePaymentResult = ApiDto<Schemas['CreatePaymentResult'], 'fiscalReceiptId'>

// ── Bonuri fiscale ──────────────────────────────────────────────────────────
export type FiscalReceiptListDto = ApiDto<Schemas['FiscalReceiptListDto'], 'receiptNumber' | 'printedAt' | 'lastError'>
export type FiscalReceiptLineDto = ApiDto<Schemas['FiscalReceiptLineDto']>
export type FiscalReceiptTenderDto = ApiDto<Schemas['FiscalReceiptTenderDto'], 'devicePaymentCode'>
export type FiscalReceiptEventDto = ApiDto<Schemas['FiscalReceiptEventDto'],
  'fromStatusId' | 'fromStatusCode' | 'message' | 'createdByName'>
export type FiscalReceiptDetailDto = ApiDto<Omit<Schemas['FiscalReceiptDetailDto'], 'lines' | 'tenders' | 'events'>,
  'receiptNumber' | 'deviceSerialNumber' | 'printedAt' | 'lastError' | 'reconciliationNote' | 'reconciledAt' | 'updatedAt'> & {
  lines: FiscalReceiptLineDto[]
  tenders: FiscalReceiptTenderDto[]
  events: FiscalReceiptEventDto[]
}

// ── Facturi (sumar pe consultație) ──────────────────────────────────────────
export type InvoiceSummaryDto = ApiDto<Schemas['InvoiceSummaryDto'], 'originalInvoiceId'>

// ── Situația financiară a unei consultații ──────────────────────────────────
export type ConsultationBillingDto = ApiDto<
  Omit<Schemas['ConsultationBillingDto'], 'lines' | 'payments' | 'fiscalReceipts' | 'invoices' | 'unbilledInvestigations'>,
  'patientAddress' | 'patientCity' | 'patientCounty'> & {
  lines: ConsultationServiceDto[]
  payments: PaymentDto[]
  fiscalReceipts: FiscalReceiptListDto[]
  invoices: InvoiceSummaryDto[]
  unbilledInvestigations: UnbilledInvestigationDto[]
}

export type BillingConsultationListDto = ApiDto<Schemas['BillingConsultationListDto'],
  'invoiceNumber' | 'receiptStatusCode' | 'receiptStatusName'>
export type BillingStatsDto = ApiDto<Schemas['BillingStatsDto']>

export interface BillingConsultationsPagedResponse {
  pagedResult: PagedResponse<BillingConsultationListDto>
  stats: BillingStatsDto
}

/** Filtrul rapid din lista de încasări — valorile corespund PaymentStatusCodes din backend. */
export type PaymentStatusFilter = 'all' | 'NEPLATIT' | 'PARTIAL' | 'PLATIT'

export interface GetBillingConsultationsParams {
  search?: string
  paymentStatus?: Exclude<PaymentStatusFilter, 'all'>
  dateFrom?: string
  dateTo?: string
  page: number
  pageSize: number
}

// ── Payload-uri ─────────────────────────────────────────────────────────────
export interface PaymentTenderInput {
  paymentMethodId: string
  amount: number
}

export interface CreatePaymentPayload {
  consultationId: string
  idempotencyKey: string
  tenders: PaymentTenderInput[]
  notes: string | null
}

export interface ReconcileFiscalReceiptPayload {
  id: string
  wasPrinted: boolean
  receiptNumber: string | null
  note: string | null
}

export interface ReportFiscalReceiptResultPayload {
  id: string
  statusCode: 'PRINTED' | 'FAILED' | 'UNKNOWN'
  receiptNumber: string | null
  deviceSerialNumber: string | null
  printedAt: string | null
  errorMessage: string | null
  deviceResponse: string | null
}
