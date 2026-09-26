import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  CnasDrugLookupDto,
  ConsultationMedicationDto,
  CreateConsultationMedicationPayload,
  UpdateConsultationMedicationPayload,
} from '@/features/consultations/medications/types/medication.types'

const BASE = '/api/v1/ConsultationMedications'

export const consultationMedicationsApi = {
  getByConsultation: async (consultationId: string): Promise<ConsultationMedicationDto[]> => {
    const resp = await (api.get(`${BASE}/by-consultation/${consultationId}`) as Promise<ApiResponse<ConsultationMedicationDto[]>>)
    return resp.data ?? []
  },

  searchDrugs: async (search: string): Promise<CnasDrugLookupDto[]> => {
    const resp = await (api.get(`${BASE}/drug-search`, { params: { search } }) as Promise<ApiResponse<CnasDrugLookupDto[]>>)
    return resp.data ?? []
  },

  create: async (payload: CreateConsultationMedicationPayload): Promise<string> => {
    const resp = await (api.post(BASE, payload) as Promise<ApiResponse<string>>)
    return resp.data!
  },

  update: async ({ id, ...body }: UpdateConsultationMedicationPayload): Promise<boolean> => {
    const resp = await (api.put(`${BASE}/${id}`, body) as Promise<ApiResponse<boolean>>)
    return resp.data ?? true
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}
