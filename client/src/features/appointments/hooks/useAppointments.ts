import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { appointmentsApi } from '@/api/endpoints/appointments.api'
import type {
  GetAppointmentsParams,
  CreateAppointmentPayload,
  UpdateAppointmentPayload,
  UpdateAppointmentStatusPayload,
} from '../types/appointment.types'

// ── Query Keys ────────────────────────────────────────────────────────────────
export const appointmentKeys = {
  all:       ['appointments'] as const,
  lists:     () => [...appointmentKeys.all, 'list'] as const,
  list:      (params: GetAppointmentsParams) => [...appointmentKeys.lists(), params] as const,
  details:   () => [...appointmentKeys.all, 'detail'] as const,
  detail:    (id: string) => [...appointmentKeys.details(), id] as const,
  scheduler: (dateFrom: string, dateTo: string, doctorId?: string) =>
    [...appointmentKeys.all, 'scheduler', { dateFrom, dateTo, doctorId }] as const,
}

// ── Listare paginată ──────────────────────────────────────────────────────────
export const useAppointments = (params: GetAppointmentsParams) =>
  useQuery({
    queryKey: appointmentKeys.list(params),
    queryFn: () => appointmentsApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 1 * 60 * 1000,
  })

// ── Detaliu programare ───────────────────────────────────────────────────────
export const useAppointmentDetail = (id: string, enabled = true) =>
  useQuery({
    queryKey: appointmentKeys.detail(id),
    queryFn: () => appointmentsApi.getById(id),
    enabled: !!id && enabled,
  })

// ── Date pentru scheduler ────────────────────────────────────────────────────
export const useAppointmentsForScheduler = (dateFrom: string, dateTo: string, doctorId?: string) =>
  useQuery({
    queryKey: appointmentKeys.scheduler(dateFrom, dateTo, doctorId),
    queryFn: () => appointmentsApi.getForScheduler(dateFrom, dateTo, doctorId),
    staleTime: 30 * 1000,
  })

// ── Creare programare ────────────────────────────────────────────────────────
export const useCreateAppointment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => appointmentsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}

// ── Actualizare programare ───────────────────────────────────────────────────
export const useUpdateAppointment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateAppointmentPayload) => appointmentsApi.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}

// ── Actualizare status programare ────────────────────────────────────────────
export const useUpdateAppointmentStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateAppointmentStatusPayload) => appointmentsApi.updateStatus(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.all })
    },
  })
}

// ── Ștergere programare (soft delete) ────────────────────────────────────────
export const useDeleteAppointment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: appointmentKeys.lists() })
    },
  })
}
