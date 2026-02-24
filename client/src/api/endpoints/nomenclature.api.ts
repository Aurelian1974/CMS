import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  SpecialtyDto,
  SpecialtyTreeNode,
  CreateSpecialtyPayload,
  UpdateSpecialtyPayload,
  ToggleSpecialtyPayload,
} from '@/features/nomenclature/types/specialty.types'

export const nomenclatureApi = {
  // ===== Specializări =====

  getSpecialties: (isActive?: boolean): Promise<ApiResponse<SpecialtyDto[]>> =>
    api.get('/api/nomenclature/specialties', { params: { isActive } }),

  getSpecialtyTree: (isActive?: boolean): Promise<ApiResponse<SpecialtyTreeNode[]>> =>
    api.get('/api/nomenclature/specialties/tree', { params: { isActive } }),

  getSpecialtyById: (id: string): Promise<ApiResponse<SpecialtyDto>> =>
    api.get(`/api/nomenclature/specialties/${id}`),

  createSpecialty: (payload: CreateSpecialtyPayload): Promise<ApiResponse<string>> =>
    api.post('/api/nomenclature/specialties', payload),

  updateSpecialty: ({ id, ...data }: UpdateSpecialtyPayload): Promise<ApiResponse<null>> =>
    api.put(`/api/nomenclature/specialties/${id}`, data),

  toggleSpecialty: (id: string, payload: ToggleSpecialtyPayload): Promise<ApiResponse<null>> =>
    api.patch(`/api/nomenclature/specialties/${id}/toggle`, payload),
}
