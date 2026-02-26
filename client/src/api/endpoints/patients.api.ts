import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  PatientFullDetailDto,
  PatientsPagedResponse,
  GetPatientsParams,
  CreatePatientPayload,
  UpdatePatientPayload,
} from '@/features/patients/types/patient.types'

export const patientsApi = {
  getAll: (params: GetPatientsParams): Promise<ApiResponse<PatientsPagedResponse>> =>
    api.get('/api/patients', { params }),

  getById: (id: string): Promise<ApiResponse<PatientFullDetailDto>> =>
    api.get(`/api/patients/${id}`),

  create: (payload: CreatePatientPayload): Promise<ApiResponse<string>> =>
    api.post('/api/patients', payload),

  update: ({ id, ...data }: UpdatePatientPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/patients/${id}`, data),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/patients/${id}`),
}
