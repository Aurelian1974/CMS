import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  ConsultationDetailDto,
  ConsultationsPagedResponse,
  GetConsultationsParams,
  CreateConsultationPayload,
  UpdateConsultationPayload,
} from '@/features/consultations/types/consultation.types'

export const consultationsApi = {
  getAll: (params: GetConsultationsParams): Promise<ApiResponse<ConsultationsPagedResponse>> =>
    api.get('/api/v1/Consultations', { params }),

  getById: (id: string): Promise<ApiResponse<ConsultationDetailDto>> =>
    api.get(`/api/v1/Consultations/${id}`),

  getByAppointmentId: (appointmentId: string): Promise<ApiResponse<ConsultationDetailDto | null>> =>
    api.get(`/api/v1/Consultations/by-appointment/${appointmentId}`),

  create: (payload: CreateConsultationPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Consultations', payload),

  update: ({ id, ...data }: UpdateConsultationPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Consultations/${id}`, data),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/Consultations/${id}`),
}
