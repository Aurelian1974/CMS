import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  ClinicScheduleDto,
  DoctorScheduleDto,
  DoctorDayDto,
  UpsertClinicDayPayload,
  UpsertDoctorDayPayload,
} from '../types/schedule.types'

export const scheduleApi = {
  getClinicSchedule: (): Promise<ApiResponse<ClinicScheduleDto[]>> =>
    api.get('/api/schedule/clinic'),

  upsertClinicDay: (payload: UpsertClinicDayPayload): Promise<ApiResponse<boolean>> =>
    api.put('/api/schedule/clinic/day', payload),

  getDoctorScheduleByClinic: (): Promise<ApiResponse<DoctorScheduleDto[]>> =>
    api.get('/api/schedule/doctors'),

  getDoctorSchedule: (doctorId: string): Promise<ApiResponse<DoctorDayDto[]>> =>
    api.get(`/api/schedule/doctors/${doctorId}`),

  upsertDoctorDay: (doctorId: string, payload: UpsertDoctorDayPayload): Promise<ApiResponse<boolean>> =>
    api.put(`/api/schedule/doctors/${doctorId}/day`, payload),

  deleteDoctorDay: (doctorId: string, dayOfWeek: number): Promise<ApiResponse<boolean>> =>
    api.delete(`/api/schedule/doctors/${doctorId}/day/${dayOfWeek}`),
}
