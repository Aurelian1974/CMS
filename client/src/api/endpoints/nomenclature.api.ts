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
import type { NomenclatureItem } from '@/types/common.types'
import type { CountyDto, LocalityDto } from '@/features/nomenclature/types/geography.types'
import type { CaenCodeDto, CaenCodeSearchParams } from '@/features/nomenclature/types/caenCode.types'

export const nomenclatureApi = {
  // ===== Specializări =====

  getSpecialties: (isActive?: boolean): Promise<ApiResponse<SpecialtyDto[]>> =>
    api.get('/api/v1/Nomenclature/specialties', { params: { isActive } }),

  getSpecialtyTree: (isActive?: boolean): Promise<ApiResponse<SpecialtyTreeNode[]>> =>
    api.get('/api/v1/Nomenclature/specialties/tree', { params: { isActive } }),

  getSpecialtyById: (id: string): Promise<ApiResponse<SpecialtyDto>> =>
    api.get(`/api/v1/Nomenclature/specialties/${id}`),

  createSpecialty: (payload: CreateSpecialtyPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Nomenclature/specialties', payload),

  updateSpecialty: ({ id, ...data }: UpdateSpecialtyPayload): Promise<ApiResponse<null>> =>
    api.put(`/api/v1/Nomenclature/specialties/${id}`, data),

  toggleSpecialty: (id: string, payload: ToggleSpecialtyPayload): Promise<ApiResponse<null>> =>
    api.patch(`/api/v1/Nomenclature/specialties/${id}/toggle`, payload),

  // ===== Titulaturi medicale =====

  getMedicalTitles: (isActive?: boolean): Promise<ApiResponse<MedicalTitleDto[]>> =>
    api.get('/api/v1/Nomenclature/medical-titles', { params: { isActive } }),

  createMedicalTitle: (payload: CreateMedicalTitlePayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Nomenclature/medical-titles', payload),

  updateMedicalTitle: ({ id, ...data }: UpdateMedicalTitlePayload): Promise<ApiResponse<null>> =>
    api.put(`/api/v1/Nomenclature/medical-titles/${id}`, data),

  toggleMedicalTitle: (id: string, payload: ToggleMedicalTitlePayload): Promise<ApiResponse<null>> =>
    api.patch(`/api/v1/Nomenclature/medical-titles/${id}/toggle`, payload),

  // ===== Nomenclatoare simple (lookups) =====

  getGenders: (isActive?: boolean): Promise<ApiResponse<NomenclatureItem[]>> =>
    api.get('/api/v1/Nomenclature/genders', { params: { isActive } }),

  getBloodTypes: (isActive?: boolean): Promise<ApiResponse<NomenclatureItem[]>> =>
    api.get('/api/v1/Nomenclature/blood-types', { params: { isActive } }),

  getAllergyTypes: (isActive?: boolean): Promise<ApiResponse<NomenclatureItem[]>> =>
    api.get('/api/v1/Nomenclature/allergy-types', { params: { isActive } }),

  getAllergySeverities: (isActive?: boolean): Promise<ApiResponse<NomenclatureItem[]>> =>
    api.get('/api/v1/Nomenclature/allergy-severities', { params: { isActive } }),

  // ===== Geografie (Județe & Localități) =====

  getCounties: (): Promise<ApiResponse<CountyDto[]>> =>
    api.get('/api/v1/Nomenclature/counties'),

  getLocalities: (countyId: string): Promise<ApiResponse<LocalityDto[]>> =>
    api.get('/api/v1/Nomenclature/localities', { params: { countyId } }),

  // ===== Coduri CAEN =====

  searchCaenCodes: (params?: CaenCodeSearchParams): Promise<ApiResponse<CaenCodeDto[]>> =>
    api.get('/api/v1/Nomenclature/caen-codes', { params }),
}
