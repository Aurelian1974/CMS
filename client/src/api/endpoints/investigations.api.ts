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
    const res = await api.get<ApiResponse<InvestigationDto[]>>(`${BASE}/by-consultation/${consultationId}`)
    return res.data?.data ?? []
  },
  getByPatient: async (
    patientId: string,
    params: { type?: string; dateFrom?: string; dateTo?: string } = {},
  ): Promise<InvestigationDto[]> => {
    const res = await api.get<ApiResponse<InvestigationDto[]>>(`${BASE}/by-patient/${patientId}`, { params })
    return res.data?.data ?? []
  },
  getById: async (id: string): Promise<InvestigationDto> => {
    const res = await api.get<ApiResponse<InvestigationDto>>(`${BASE}/${id}`)
    return res.data!.data!
  },
  getTrending: async (params: {
    patientId: string
    type: string
    jsonPath: string
    dateFrom?: string
    dateTo?: string
  }): Promise<InvestigationTrendingPointDto[]> => {
    const res = await api.get<ApiResponse<InvestigationTrendingPointDto[]>>(`${BASE}/trending`, { params })
    return res.data?.data ?? []
  },
  getTypes: async (specialty?: string): Promise<InvestigationTypeDto[]> => {
    const res = await api.get<ApiResponse<InvestigationTypeDto[]>>(`${BASE}/types`, {
      params: specialty ? { specialty } : undefined,
    })
    return res.data?.data ?? []
  },
  create: async (payload: CreateInvestigationPayload): Promise<string> => {
    const res = await api.post<ApiResponse<string>>(BASE, payload)
    return res.data!.data!
  },
  update: async (payload: UpdateInvestigationPayload): Promise<boolean> => {
    const { id, ...body } = payload
    const res = await api.put<ApiResponse<boolean>>(`${BASE}/${id}`, body)
    return res.data?.data ?? true
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${BASE}/${id}`)
  },
}

export const documentsApi = {
  upload: async (file: File): Promise<DocumentDto> => {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api.post<ApiResponse<DocumentDto>>('/api/v1/Documents/upload', fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return res.data!.data!
  },
  downloadUrl: (id: string) => `/api/v1/Documents/${id}`,
}
