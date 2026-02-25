import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  SpecialtyDto,
  SpecialtyTreeNode,
  CreateSpecialtyPayload,
  UpdateSpecialtyPayload,
  ToggleSpecialtyPayload,
} from '@/features/nomenclature/types/specialty.types'
import type {
  MedicalTitleDto,
  CreateMedicalTitlePayload,
  UpdateMedicalTitlePayload,
  ToggleMedicalTitlePayload,
} from '@/features/nomenclature/types/medicalTitle.types'

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

  // ===== Titulaturi medicale =====

  getMedicalTitles: (isActive?: boolean): Promise<ApiResponse<MedicalTitleDto[]>> =>
    api.get('/api/nomenclature/medical-titles', { params: { isActive } }),

  createMedicalTitle: (payload: CreateMedicalTitlePayload): Promise<ApiResponse<string>> =>
    api.post('/api/nomenclature/medical-titles', payload),

  updateMedicalTitle: ({ id, ...data }: UpdateMedicalTitlePayload): Promise<ApiResponse<null>> =>
    api.put(`/api/nomenclature/medical-titles/${id}`, data),

  toggleMedicalTitle: (id: string, payload: ToggleMedicalTitlePayload): Promise<ApiResponse<null>> =>
    api.patch(`/api/nomenclature/medical-titles/${id}/toggle`, payload),
}
