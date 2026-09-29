import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  AdministrativeStaffDetailDto,
  AdministrativeStaffLookupDto,
  AdministrativeStaffPagedResult,
  AdministrativePositionDto,
  GetAdministrativeStaffParams,
  CreateAdministrativeStaffPayload,
  UpdateAdministrativeStaffPayload,
} from '@/features/administrativeStaff/types/administrativeStaff.types'

export const administrativeStaffApi = {
  getAll: (params: GetAdministrativeStaffParams): Promise<ApiResponse<AdministrativeStaffPagedResult>> =>
    api.get('/api/v1/AdministrativeStaff', { params }),

  getById: (id: string): Promise<ApiResponse<AdministrativeStaffDetailDto>> =>
    api.get(`/api/v1/AdministrativeStaff/${id}`),

  getLookup: (): Promise<ApiResponse<AdministrativeStaffLookupDto[]>> =>
    api.get('/api/v1/AdministrativeStaff/lookup'),

  getPositions: (): Promise<ApiResponse<AdministrativePositionDto[]>> =>
    api.get('/api/v1/AdministrativeStaff/positions', { params: { isActive: true } }),

  create: (payload: CreateAdministrativeStaffPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/AdministrativeStaff', payload),

  update: ({ id, ...data }: UpdateAdministrativeStaffPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/AdministrativeStaff/${id}`, data),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/AdministrativeStaff/${id}`),
}
