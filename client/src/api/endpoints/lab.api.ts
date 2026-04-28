import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  AnalysisDictionaryDto,
  CreateRecommendedAnalysisPayload,
  LabParseResultDto,
  RecommendedAnalysisDto,
  UpdateRecommendedAnalysisPayload,
} from '@/features/consultations/lab/types/lab.types'

const LAB = '/api/v1/Lab'
const REC = '/api/v1/RecommendedAnalyses'
const ANA = '/api/v1/Analyses'

export const labApi = {
  parsePdf: async (file: File): Promise<LabParseResultDto> => {
    const fd = new FormData()
    fd.append('file', file)
    const resp = await (api.post(`${LAB}/parse`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as Promise<ApiResponse<LabParseResultDto>>)
    return resp.data!
  },
}

export const recommendedAnalysesApi = {
  getByConsultation: async (consultationId: string): Promise<RecommendedAnalysisDto[]> => {
    const resp = await (api.get(`${REC}/by-consultation/${consultationId}`) as Promise<ApiResponse<RecommendedAnalysisDto[]>>)
    return resp.data ?? []
  },
  create: async (payload: CreateRecommendedAnalysisPayload): Promise<string> => {
    const resp = await (api.post(REC, payload) as Promise<ApiResponse<string>>)
    return resp.data!
  },
  update: async (payload: UpdateRecommendedAnalysisPayload): Promise<boolean> => {
    const { id, ...body } = payload
    const resp = await (api.put(`${REC}/${id}`, body) as Promise<ApiResponse<boolean>>)
    return resp.data ?? true
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`${REC}/${id}`)
  },
}

export const analysesDictApi = {
  search: async (q: string, top = 50): Promise<AnalysisDictionaryDto[]> => {
    if (!q || q.trim().length < 2) return []
    const resp = await (api.get(`${ANA}/search`, { params: { q, top } }) as Promise<ApiResponse<AnalysisDictionaryDto[]>>)
    return resp.data ?? []
  },
}
