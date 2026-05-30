import api from '@/api/axiosInstance'
import type {
  AnalysesResultListDto,
  AnalysesResultDetailDto,
  AnalysesResultsByPatientResponse,
  CreateAnalysesResultPayload,
  UpdateAnalysesResultPayload,
} from '@/features/consultations/lab/types/analysesResults.types'

export const analysesResultsApi = {
  getByConsultation: (consultationId: string): Promise<AnalysesResultListDto[]> =>
    api.get(`/api/v1/AnalysesResults/by-consultation/${consultationId}`).then((r) => r.data.data),

  getByPatient: (
    patientId: string,
    dateFrom?: string,
    dateTo?: string,
  ): Promise<AnalysesResultsByPatientResponse> =>
    api
      .get(`/api/v1/AnalysesResults/by-patient/${patientId}`, {
        params: { dateFrom, dateTo },
      })
      .then((r) => r.data.data),

  getById: (id: string): Promise<AnalysesResultDetailDto> =>
    api.get(`/api/v1/AnalysesResults/${id}`).then((r) => r.data.data),

  create: (payload: CreateAnalysesResultPayload): Promise<string> =>
    api.post('/api/v1/AnalysesResults', payload).then((r) => r.data.data),

  update: (id: string, payload: UpdateAnalysesResultPayload): Promise<boolean> =>
    api.put(`/api/v1/AnalysesResults/${id}`, payload).then((r) => r.data.data),

  delete: (id: string): Promise<boolean> =>
    api.delete(`/api/v1/AnalysesResults/${id}`).then((r) => r.data.data),
}
