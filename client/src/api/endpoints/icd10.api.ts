import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type { ICD10SearchResult } from '@/features/consultations/types/icd10.types'

export const icd10Api = {
  search: (term: string, maxResults = 20): Promise<ApiResponse<ICD10SearchResult[]>> =>
    api.get('/api/v1/ICD10/search', { params: { term, maxResults } }),

  getFavorites: (): Promise<ApiResponse<ICD10SearchResult[]>> =>
    api.get('/api/v1/ICD10/favorites'),

  addFavorite: (icd10Id: string): Promise<ApiResponse<boolean>> =>
    api.post(`/api/v1/ICD10/favorites/${icd10Id}`),

  removeFavorite: (icd10Id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/ICD10/favorites/${icd10Id}`),
}
