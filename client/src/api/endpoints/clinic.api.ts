import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  ClinicDto,
  ClinicLocationDto,
  UpdateClinicPayload,
  CreateClinicLocationPayload,
  UpdateClinicLocationPayload,
} from '@/features/clinic/types/clinic.types'

export const clinicApi = {
  // ===== Clinica curentă =====

  getCurrentClinic: (): Promise<ApiResponse<ClinicDto>> =>
    api.get('/api/clinics/current'),

  updateCurrentClinic: (payload: UpdateClinicPayload): Promise<ApiResponse<boolean>> =>
    api.put('/api/clinics/current', payload),

  // ===== Locații =====

  getLocations: (isActive?: boolean): Promise<ApiResponse<ClinicLocationDto[]>> =>
    api.get('/api/clinics/current/locations', { params: { isActive } }),

  createLocation: (payload: CreateClinicLocationPayload): Promise<ApiResponse<string>> =>
    api.post('/api/clinics/current/locations', payload),

  updateLocation: ({ id, ...data }: UpdateClinicLocationPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/clinics/current/locations/${id}`, data),

  deleteLocation: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/clinics/current/locations/${id}`),
}
