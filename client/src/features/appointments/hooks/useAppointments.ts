import { useQuery, useMutation, useQueryClient, keepPreviousData, type QueryClient } from '@tanstack/react-query'
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
  statuses:  () => [...appointmentKeys.all, 'statuses'] as const,
  conflicts: (doctorId: string, startTime: string, endTime: string, excludeId?: string) =>
    [...appointmentKeys.all, 'conflicts', { doctorId, startTime, endTime, excludeId }] as const,
  byPatient: (patientId: string) => [...appointmentKeys.all, 'by-patient', patientId] as const,
}

// ── Nomenclator statusuri (se schimbă rar → cache lung) ───────────────────────
export const useAppointmentStatuses = () =>
  useQuery({
    queryKey: appointmentKeys.statuses(),
    queryFn: () => appointmentsApi.getStatuses(),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
  })

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

// ── Conflicte pentru un interval propus (avertizare live în formular) ──────────
export interface ConflictCheckParams {
  doctorId: string
  startTime: string
  endTime: string
  excludeId?: string
}

export const useAppointmentConflicts = (params: ConflictCheckParams | null) =>
  useQuery({
    queryKey: params
      ? appointmentKeys.conflicts(params.doctorId, params.startTime, params.endTime, params.excludeId)
      : [...appointmentKeys.all, 'conflicts', 'idle'],
    queryFn: () => appointmentsApi.getConflicts(params!.doctorId, params!.startTime, params!.endTime, params!.excludeId),
    enabled: !!params,
    staleTime: 15 * 1000,
  })

// ── Istoric programări pacient ────────────────────────────────────────────────
export const usePatientAppointments = (patientId: string, enabled = true) =>
  useQuery({
    queryKey: appointmentKeys.byPatient(patientId),
    queryFn: () => appointmentsApi.getByPatient(patientId),
    enabled: !!patientId && enabled,
    staleTime: 60 * 1000,
  })

// ── Invalidare comună după orice scriere (listă + scheduler + detaliu) ────────
const invalidateAppointments = (qc: QueryClient, id?: string) => {
  qc.invalidateQueries({ queryKey: appointmentKeys.lists() })
  qc.invalidateQueries({ queryKey: [...appointmentKeys.all, 'scheduler'] })
  qc.invalidateQueries({ queryKey: [...appointmentKeys.all, 'by-patient'] })
  if (id) qc.invalidateQueries({ queryKey: appointmentKeys.detail(id) })
}

// ── Creare programare ────────────────────────────────────────────────────────
export const useCreateAppointment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => appointmentsApi.create(payload),
    onSuccess: () => invalidateAppointments(qc),
  })
}

// ── Actualizare programare ───────────────────────────────────────────────────
export const useUpdateAppointment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateAppointmentPayload) => appointmentsApi.update(payload),
    onSuccess: (_data, variables) => invalidateAppointments(qc, variables.id),
    // Un eșec (ex. 409 concurență) poate însemna date vechi în cache → reîmprospătare
    onError: (_err, variables) => invalidateAppointments(qc, variables.id),
  })
}

// ── Actualizare status programare ────────────────────────────────────────────
export const useUpdateAppointmentStatus = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateAppointmentStatusPayload) => appointmentsApi.updateStatus(payload),
    onSuccess: (_data, variables) => invalidateAppointments(qc, variables.id),
  })
}

// ── Ștergere programare (soft delete) ────────────────────────────────────────
export const useDeleteAppointment = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => appointmentsApi.delete(id),
    onSuccess: (_data, id) => invalidateAppointments(qc, id),
  })
}
