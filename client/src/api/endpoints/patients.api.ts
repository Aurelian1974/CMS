import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  PatientFullDetailDto,
  PatientsPagedResponse,
  GetPatientsParams,
  CreatePatientPayload,
  UpdatePatientPayload,
} from '@/features/patients/types/patient.types'
import type { PatientLookupDto } from '@/features/appointments/types/appointment.types'

export const patientsApi = {
  getAll: (params: GetPatientsParams): Promise<ApiResponse<PatientsPagedResponse>> =>
    api.get('/api/v1/Patients', { params }),

  getById: (id: string): Promise<ApiResponse<PatientFullDetailDto>> =>
    api.get(`/api/v1/Patients/${id}`),

  create: (payload: CreatePatientPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Patients', payload),

  update: ({ id, ...data }: UpdatePatientPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Patients/${id}`, data),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/Patients/${id}`),

  getLookup: (): Promise<ApiResponse<PatientLookupDto[]>> =>
    api.get('/api/v1/Patients/lookup'),
}
