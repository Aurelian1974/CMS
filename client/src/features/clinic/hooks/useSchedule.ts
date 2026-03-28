import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { scheduleApi } from '@/api/endpoints/schedule.api'
import type { UpsertClinicDayPayload, UpsertDoctorDayPayload } from '../types/schedule.types'

// ── Query keys ────────────────────────────────────────────────────────────────

export const scheduleKeys = {
  all:          ['schedule'] as const,
  clinic:       () => [...scheduleKeys.all, 'clinic'] as const,
  doctors:      () => [...scheduleKeys.all, 'doctors'] as const,
  doctor:       (id: string) => [...scheduleKeys.doctors(), id] as const,
}

// ── Clinic schedule queries ───────────────────────────────────────────────────

export const useClinicSchedule = () =>
  useQuery({
    queryKey: scheduleKeys.clinic(),
    queryFn: () => scheduleApi.getClinicSchedule(),
    staleTime: Infinity,
  })

export const useUpsertClinicDay = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpsertClinicDayPayload) => scheduleApi.upsertClinicDay(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: scheduleKeys.clinic() })
    },
  })
}

// ── Doctor schedule queries ───────────────────────────────────────────────────

export const useDoctorSchedules = () =>
  useQuery({
    queryKey: scheduleKeys.doctors(),
    queryFn: () => scheduleApi.getDoctorScheduleByClinic(),
    staleTime: Infinity,
  })

export const useDoctorSchedule = (doctorId: string | null) =>
  useQuery({
    queryKey: scheduleKeys.doctor(doctorId ?? ''),
    queryFn: () => scheduleApi.getDoctorSchedule(doctorId!),
    enabled: !!doctorId,
    staleTime: Infinity,
  })

export const useUpsertDoctorDay = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ doctorId, payload }: { doctorId: string; payload: UpsertDoctorDayPayload }) =>
      scheduleApi.upsertDoctorDay(doctorId, payload),
    onSuccess: (_data, { doctorId }) => {
      qc.invalidateQueries({ queryKey: scheduleKeys.doctor(doctorId) })
      qc.invalidateQueries({ queryKey: scheduleKeys.doctors() })
    },
  })
}

export const useDeleteDoctorDay = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ doctorId, dayOfWeek }: { doctorId: string; dayOfWeek: number }) =>
      scheduleApi.deleteDoctorDay(doctorId, dayOfWeek),
    onSuccess: (_data, { doctorId }) => {
      qc.invalidateQueries({ queryKey: scheduleKeys.doctor(doctorId) })
      qc.invalidateQueries({ queryKey: scheduleKeys.doctors() })
    },
  })
}
