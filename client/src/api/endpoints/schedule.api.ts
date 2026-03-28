import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  ClinicScheduleDto,
  DoctorScheduleDto,
  DoctorDayDto,
  UpsertClinicDayPayload,
  UpsertDoctorDayPayload,
} from '@/features/clinic/types/schedule.types'

export const scheduleApi = {
  getClinicSchedule: (): Promise<ApiResponse<ClinicScheduleDto[]>> =>
    api.get('/api/v1/Schedule/clinic'),

  upsertClinicDay: (payload: UpsertClinicDayPayload): Promise<ApiResponse<boolean>> =>
    api.put('/api/v1/Schedule/clinic/day', payload),

  getDoctorScheduleByClinic: (): Promise<ApiResponse<DoctorScheduleDto[]>> =>
    api.get('/api/v1/Schedule/doctors'),

  getDoctorSchedule: (doctorId: string): Promise<ApiResponse<DoctorDayDto[]>> =>
    api.get(`/api/v1/Schedule/doctors/${doctorId}`),

  upsertDoctorDay: (doctorId: string, payload: UpsertDoctorDayPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/v1/Schedule/doctors/${doctorId}/day`, payload),

  deleteDoctorDay: (doctorId: string, dayOfWeek: number): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/v1/Schedule/doctors/${doctorId}/day/${dayOfWeek}`),
}
