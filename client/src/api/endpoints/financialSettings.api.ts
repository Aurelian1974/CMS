import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  BridgePairingKeyDto,
  BridgePairingTicketDto,
  CreateInvoiceSeriesPayload,
  FiscalSettingsDto,
  InvoiceSeriesDto,
  UpdateFiscalSettingsPayload,
  UpdateInvoiceSeriesPayload,
} from '@/features/settings/types/financialSettings.types'

const BASE = '/api/v1/FinancialSettings'

export const financialSettingsApi = {
  getFiscal: (): Promise<ApiResponse<FiscalSettingsDto>> =>
    api.get(`${BASE}/fiscal`),

  updateFiscal: (payload: UpdateFiscalSettingsPayload): Promise<ApiResponse<boolean>> =>
    api.put(`${BASE}/fiscal`, payload),

  createBridgePairingTicket: (): Promise<ApiResponse<BridgePairingTicketDto>> =>
    api.post(`${BASE}/fiscal/bridge-pairing-ticket`),

  getBridgePairingKey: (): Promise<ApiResponse<BridgePairingKeyDto>> =>
    api.get(`${BASE}/fiscal/bridge-pairing-key`),

  getInvoiceSeries: (): Promise<ApiResponse<InvoiceSeriesDto[]>> =>
    api.get(`${BASE}/invoice-series`),

  createInvoiceSeries: (payload: CreateInvoiceSeriesPayload): Promise<ApiResponse<string>> =>
    api.post(`${BASE}/invoice-series`, payload),

  updateInvoiceSeries: ({ id, ...body }: UpdateInvoiceSeriesPayload): Promise<ApiResponse<boolean>> =>
    api.put(`${BASE}/invoice-series/${id}`, body),
}
