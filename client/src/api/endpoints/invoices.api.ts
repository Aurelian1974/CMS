import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  CreateInvoicePayload,
  CreateInvoiceResult,
  GetInvoicesParams,
  InvoiceDetailDto,
  InvoicesPagedResponse,
  StornoInvoicePayload,
} from '@/features/invoices/types/invoice.types'

const BASE = '/api/v1/Invoices'

export const invoicesApi = {
  getAll: (params: GetInvoicesParams): Promise<ApiResponse<InvoicesPagedResponse>> =>
    api.get(BASE, { params }),

  getById: (id: string): Promise<ApiResponse<InvoiceDetailDto>> =>
    api.get(`${BASE}/${id}`),

  // Interceptorul întoarce direct `response.data`, deci aici e chiar Blob-ul
  getPdf: (id: string): Promise<Blob> =>
    api.get(`${BASE}/${id}/pdf`, { responseType: 'blob' }),

  create: (payload: CreateInvoicePayload): Promise<ApiResponse<CreateInvoiceResult>> =>
    api.post(BASE, payload),

  storno: ({ id, ...body }: StornoInvoicePayload): Promise<ApiResponse<CreateInvoiceResult>> =>
    api.post(`${BASE}/${id}/storno`, body),
}
