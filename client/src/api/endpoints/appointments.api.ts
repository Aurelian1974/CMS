import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  AppointmentDetailDto,
  AppointmentsPagedResponse,
  GetAppointmentsParams,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
  UpdateAppointmentStatusPayload,
  AppointmentSchedulerDto,
} from '@/features/appointments/types/appointment.types'

export const appointmentsApi = {
  getAll: (params: GetAppointmentsParams): Promise<ApiResponse<AppointmentsPagedResponse>> =>
    api.get('/api/appointments', { params }),

  getById: (id: string): Promise<ApiResponse<AppointmentDetailDto>> =>
    api.get(`/api/appointments/${id}`),

  getForScheduler: (dateFrom: string, dateTo: string, doctorId?: string): Promise<ApiResponse<AppointmentSchedulerDto[]>> =>
    api.get('/api/appointments/scheduler', { params: { dateFrom, dateTo, doctorId } }),

  create: (payload: CreateAppointmentPayload): Promise<ApiResponse<string>> =>
    api.post('/api/appointments', payload),

  update: ({ id, ...data }: UpdateAppointmentPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/appointments/${id}`, data),

  updateStatus: ({ id, statusId }: UpdateAppointmentStatusPayload): Promise<ApiResponse<boolean>> =>
    api.patch(`/api/appointments/${id}/status`, { statusId }),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/appointments/${id}`),
}
