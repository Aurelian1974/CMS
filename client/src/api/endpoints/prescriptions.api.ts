import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  CancelPrescriptionPayload,
  CreatePrescriptionsPayload,
  GenerateConsultationPrescriptionsPayload,
  GetPrescriptionsParams,
  PrescriptionDetailDto,
  PrescriptionListDto,
  PrescriptionLookupsDto,
  PrescriptionsPagedResponse,
  UpdatePrescriptionPayload,
} from '@/features/prescriptions/types/prescription.types'

const BASE = '/api/v1/Prescriptions'

export const prescriptionsApi = {
  getAll: (params: GetPrescriptionsParams): Promise<ApiResponse<PrescriptionsPagedResponse>> =>
    api.get(BASE, { params }),

  getById: (id: string): Promise<ApiResponse<PrescriptionDetailDto>> =>
    api.get(`${BASE}/${id}`),

  getLookups: (): Promise<ApiResponse<PrescriptionLookupsDto>> =>
    api.get(`${BASE}/lookups`),

  getByConsultation: (consultationId: string): Promise<ApiResponse<PrescriptionListDto[]>> =>
    api.get(`${BASE}/by-consultation/${consultationId}`),

  // Interceptorul întoarce direct `response.data`, deci aici e chiar Blob-ul
  getPdf: (id: string): Promise<Blob> =>
    api.get(`${BASE}/${id}/pdf`, { responseType: 'blob' }),

  create: (payload: CreatePrescriptionsPayload): Promise<ApiResponse<string[]>> =>
    api.post(BASE, payload),

  generateFromConsultation: ({ consultationId, ...body }: GenerateConsultationPrescriptionsPayload): Promise<ApiResponse<string[]>> =>
    api.post(`${BASE}/from-consultation/${consultationId}`, body),

  update: ({ id, ...body }: UpdatePrescriptionPayload): Promise<ApiResponse<boolean>> =>
    api.put(`${BASE}/${id}`, body),

  issue: (id: string): Promise<ApiResponse<boolean>> =>
    api.post(`${BASE}/${id}/issue`),

  transmit: (id: string): Promise<ApiResponse<boolean>> =>
    api.post(`${BASE}/${id}/transmit`),

  cancel: ({ id, reason }: CancelPrescriptionPayload): Promise<ApiResponse<boolean>> =>
    api.post(`${BASE}/${id}/cancel`, { reason }),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`${BASE}/${id}`),
}
