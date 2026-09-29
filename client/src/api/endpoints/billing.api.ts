import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  BillingConsultationsPagedResponse,
  ConsultationBillingDto,
  ConsultationServicesResponse,
  CreatePaymentPayload,
  CreatePaymentResult,
  FiscalReceiptDetailDto,
  GetBillingConsultationsParams,
  ReconcileFiscalReceiptPayload,
  ReportFiscalReceiptResultPayload,
} from '@/features/billing/types/billing.types'

const BILLING = '/api/v1/Billing'
const CONSULTATION_SERVICES = '/api/v1/ConsultationServices'

/** Încasări (modulul payments) — folosit de recepție. */
export const billingApi = {
  getConsultations: (params: GetBillingConsultationsParams): Promise<ApiResponse<BillingConsultationsPagedResponse>> =>
    api.get(`${BILLING}/consultations`, { params }),

  getConsultation: (consultationId: string): Promise<ApiResponse<ConsultationBillingDto>> =>
    api.get(`${BILLING}/consultations/${consultationId}`),

  addService: (consultationId: string, medicalServiceId: string, quantity: number): Promise<ApiResponse<string>> =>
    api.post(`${BILLING}/consultations/${consultationId}/services`, { medicalServiceId, quantity }),

  updateServiceQuantity: (id: string, quantity: number): Promise<ApiResponse<boolean>> =>
    api.put(`${BILLING}/services/${id}`, { quantity }),

  deleteService: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`${BILLING}/services/${id}`),

  syncInvestigationServices: (consultationId: string): Promise<ApiResponse<number>> =>
    api.post(`${BILLING}/consultations/${consultationId}/services/sync-investigations`),

  createPayment: ({ consultationId, ...body }: CreatePaymentPayload): Promise<ApiResponse<CreatePaymentResult>> =>
    api.post(`${BILLING}/consultations/${consultationId}/payments`, body),

  cancelPayment: (id: string, reason: string): Promise<ApiResponse<boolean>> =>
    api.post(`${BILLING}/payments/${id}/cancel`, { reason }),

  getFiscalReceipt: (id: string): Promise<ApiResponse<FiscalReceiptDetailDto>> =>
    api.get(`${BILLING}/fiscal-receipts/${id}`),

  startFiscalReceipt: (id: string): Promise<ApiResponse<FiscalReceiptDetailDto>> =>
    api.post(`${BILLING}/fiscal-receipts/${id}/start`),

  reportFiscalReceiptResult: ({ id, ...body }: ReportFiscalReceiptResultPayload): Promise<ApiResponse<boolean>> =>
    api.post(`${BILLING}/fiscal-receipts/${id}/result`, body),

  reconcileFiscalReceipt: ({ id, ...body }: ReconcileFiscalReceiptPayload): Promise<ApiResponse<boolean>> =>
    api.post(`${BILLING}/fiscal-receipts/${id}/reconcile`, body),
}

/** Serviciile efectuate, din fișa consultației (modulul consultations) — folosit de medic. */
export const consultationServicesApi = {
  getByConsultation: (consultationId: string): Promise<ApiResponse<ConsultationServicesResponse>> =>
    api.get(`${CONSULTATION_SERVICES}/by-consultation/${consultationId}`),

  add: (consultationId: string, medicalServiceId: string, quantity: number): Promise<ApiResponse<string>> =>
    api.post(CONSULTATION_SERVICES, { consultationId, medicalServiceId, quantity }),

  updateQuantity: (id: string, quantity: number): Promise<ApiResponse<boolean>> =>
    api.put(`${CONSULTATION_SERVICES}/${id}`, { quantity }),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`${CONSULTATION_SERVICES}/${id}`),

  syncInvestigations: (consultationId: string): Promise<ApiResponse<number>> =>
    api.post(`${CONSULTATION_SERVICES}/by-consultation/${consultationId}/sync-investigations`),
}
