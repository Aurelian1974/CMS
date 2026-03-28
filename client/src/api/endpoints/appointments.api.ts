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
    api.get('/api/v1/Appointments', { params }),

  getById: (id: string): Promise<ApiResponse<AppointmentDetailDto>> =>
    api.get(`/api/v1/Appointments/${id}`),

  getForScheduler: (dateFrom: string, dateTo: string, doctorId?: string): Promise<ApiResponse<AppointmentSchedulerDto[]>> =>
    api.get('/api/v1/Appointments/scheduler', { params: { dateFrom, dateTo, doctorId } }),

  create: (payload: CreateAppointmentPayload): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Appointments', payload),

  update: ({ id, ...data }: UpdateAppointmentPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Appointments/${id}`, data),

  updateStatus: ({ id, statusId }: UpdateAppointmentStatusPayload): Promise<ApiResponse<boolean>> =>
    api.patch(`/api/v1/Appointments/${id}/status`, { statusId }),

  delete: (id: string): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/Appointments/${id}`),
}
