import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  DoctorDetailDto,
  DoctorLookupDto,
  DoctorsPagedResult,
  GetDoctorsParams,
  CreateDoctorPayload,
  UpdateDoctorPayload,
} from '@/features/doctors/types/doctor.types'

export const doctorsApi = {
  getAll: (params: GetDoctorsParams): Promise<ApiResponse<DoctorsPagedResult>> =>
    api.get('/api/v1/Doctors', { params }),

  getById: (id: string): Promise<ApiResponse<DoctorDetailDto>> =>
    api.get(`/api/v1/Doctors/${id}`),

  getLookup: (): Promise<ApiResponse<DoctorLookupDto[]>> =>
    api.get('/api/v1/Doctors/lookup'),

  create: (payload: CreateDoctorPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Doctors', payload),

  update: ({ id, ...data }: UpdateDoctorPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Doctors/${id}`, data),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/Doctors/${id}`),
}
