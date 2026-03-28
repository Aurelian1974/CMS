import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  MedicalStaffDetailDto,
  MedicalStaffLookupDto,
  MedicalStaffPagedResult,
  GetMedicalStaffParams,
  CreateMedicalStaffPayload,
  UpdateMedicalStaffPayload,
} from '@/features/medicalStaff/types/medicalStaff.types'

export const medicalStaffApi = {
  getAll: (params: GetMedicalStaffParams): Promise<ApiResponse<MedicalStaffPagedResult>> =>
    api.get('/api/v1/MedicalStaff', { params }),

  getById: (id: string): Promise<ApiResponse<MedicalStaffDetailDto>> =>
    api.get(`/api/v1/MedicalStaff/${id}`),

  getLookup: (): Promise<ApiResponse<MedicalStaffLookupDto[]>> =>
    api.get('/api/v1/MedicalStaff/lookup'),

  create: (payload: CreateMedicalStaffPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/MedicalStaff', payload),

  update: ({ id, ...data }: UpdateMedicalStaffPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/MedicalStaff/${id}`, data),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/MedicalStaff/${id}`),
}
