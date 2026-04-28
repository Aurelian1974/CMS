import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  CreateInvestigationPayload,
  DocumentDto,
  InvestigationDto,
  InvestigationTrendingPointDto,
  InvestigationTypeDto,
  UpdateInvestigationPayload,
} from '@/features/consultations/investigations/types/investigation.types'

const BASE = '/api/v1/Investigations'

export const investigationsApi = {
  getByConsultation: async (consultationId: string): Promise<InvestigationDto[]> => {
    const resp = await (api.get(`${BASE}/by-consultation/${consultationId}`) as Promise<ApiResponse<InvestigationDto[]>>)
    return resp.data ?? []
  },
  getByPatient: async (
    patientId: string,
    params: { type?: string; dateFrom?: string; dateTo?: string } = {},
  ): Promise<InvestigationDto[]> => {
    const resp = await (api.get(`${BASE}/by-patient/${patientId}`, { params }) as Promise<ApiResponse<InvestigationDto[]>>)
    return resp.data ?? []
  },
  getById: async (id: string): Promise<InvestigationDto> => {
    const resp = await (api.get(`${BASE}/${id}`) as Promise<ApiResponse<InvestigationDto>>)
    return resp.data!
  },
  getTrending: async (params: {
    patientId: string
    type: string
    jsonPath: string
    dateFrom?: string
    dateTo?: string
  }): Promise<InvestigationTrendingPointDto[]> => {
    const resp = await (api.get(`${BASE}/trending`, { params }) as Promise<ApiResponse<InvestigationTrendingPointDto[]>>)
    return resp.data ?? []
  },
  getTypes: async (specialty?: string): Promise<InvestigationTypeDto[]> => {
    const resp = await (api.get(`${BASE}/types`, {
      params: specialty ? { specialty } : undefined,
    }) as Promise<ApiResponse<InvestigationTypeDto[]>>)
    return resp.data ?? []
  },
  create: async (payload: CreateInvestigationPayload): Promise<string> => {
    const resp = await (api.post(BASE, payload) as Promise<ApiResponse<string>>)
    return resp.data!
  },
  update: async (payload: UpdateInvestigationPayload): Promise<boolean> => {
    const { id, ...body } = payload
    const resp = await (api.put(`${BASE}/${id}`, body) as Promise<ApiResponse<boolean>>)
    return resp.data ?? true
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}

export const documentsApi = {
  upload: async (file: File): Promise<DocumentDto> => {
    const fd = new FormData()
    fd.append('file', file)
    const resp = await (api.post('/api/v1/Documents/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as Promise<ApiResponse<DocumentDto>>)
    return resp.data!
  },
  downloadUrl: (id: string) => `/api/v1/Documents/${id}`,
}
