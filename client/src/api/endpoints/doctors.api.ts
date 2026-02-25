import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  DoctorDto,
  DoctorDetailDto,
  DoctorLookupDto,
  DoctorsPagedResult,
  GetDoctorsParams,
  CreateDoctorPayload,
  UpdateDoctorPayload,
} from '@/features/doctors/types/doctor.types'

export const doctorsApi = {
  getAll: (params: GetDoctorsParams): Promise<ApiResponse<DoctorsPagedResult>> =>
    api.get('/api/doctors', { params }),

  getById: (id: string): Promise<ApiResponse<DoctorDetailDto>> =>
    api.get(`/api/doctors/${id}`),

  getLookup: (): Promise<ApiResponse<DoctorLookupDto[]>> =>
    api.get('/api/doctors/lookup'),

  create: (payload: CreateDoctorPayload): Promise<ApiResponse<string>> =>
    api.post('/api/doctors', payload),

  update: ({ id, ...data }: UpdateDoctorPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/doctors/${id}`, data),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/doctors/${id}`),
}
