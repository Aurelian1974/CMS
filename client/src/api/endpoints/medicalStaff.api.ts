import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  MedicalStaffDto,
  MedicalStaffDetailDto,
  MedicalStaffLookupDto,
  MedicalStaffPagedResult,
  GetMedicalStaffParams,
  CreateMedicalStaffPayload,
  UpdateMedicalStaffPayload,
} from '@/features/medicalStaff/types/medicalStaff.types'

export const medicalStaffApi = {
  getAll: (params: GetMedicalStaffParams): Promise<ApiResponse<MedicalStaffPagedResult>> =>
    api.get('/api/medicalstaff', { params }),

  getById: (id: string): Promise<ApiResponse<MedicalStaffDetailDto>> =>
    api.get(`/api/medicalstaff/${id}`),

  getLookup: (): Promise<ApiResponse<MedicalStaffLookupDto[]>> =>
    api.get('/api/medicalstaff/lookup'),

  create: (payload: CreateMedicalStaffPayload): Promise<ApiResponse<string>> =>
    api.post('/api/medicalstaff', payload),

  update: ({ id, ...data }: UpdateMedicalStaffPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/medicalstaff/${id}`, data),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/medicalstaff/${id}`),
}
