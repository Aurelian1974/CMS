import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { doctorsApi } from '@/api/endpoints/doctors.api'
import type {
  GetDoctorsParams,
  CreateDoctorPayload,
  UpdateDoctorPayload,
} from '../types/doctor.types'

// ── Query Keys ────────────────────────────────────────────────────────────────
export const doctorKeys = {
  all:     ['doctors'] as const,
  lists:   () => [...doctorKeys.all, 'list'] as const,
  list:    (params: GetDoctorsParams) => [...doctorKeys.lists(), params] as const,
  details: () => [...doctorKeys.all, 'detail'] as const,
  detail:  (id: string) => [...doctorKeys.details(), id] as const,
  lookup:  () => [...doctorKeys.all, 'lookup'] as const,
}

// ── Listare paginată ──────────────────────────────────────────────────────────
export const useDoctors = (params: GetDoctorsParams) =>
  useQuery({
    queryKey: doctorKeys.list(params),
    queryFn: () => doctorsApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000,
  })

// ── Detaliu doctor ────────────────────────────────────────────────────────────
export const useDoctorDetail = (id: string) =>
  useQuery({
    queryKey: doctorKeys.detail(id),
    queryFn: () => doctorsApi.getById(id),
    enabled: !!id,
  })

// ── Lookup (dropdown) ─────────────────────────────────────────────────────────
export const useDoctorLookup = () =>
  useQuery({
    queryKey: doctorKeys.lookup(),
    queryFn: () => doctorsApi.getLookup(),
    staleTime: 5 * 60 * 1000,
  })

// ── Creare doctor ─────────────────────────────────────────────────────────────
export const useCreateDoctor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateDoctorPayload) => doctorsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: doctorKeys.lists() })
      qc.invalidateQueries({ queryKey: doctorKeys.lookup() })
    },
  })
}

// ── Actualizare doctor ────────────────────────────────────────────────────────
export const useUpdateDoctor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateDoctorPayload) => doctorsApi.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: doctorKeys.all })
    },
  })
}

// ── Ștergere doctor (soft delete) ─────────────────────────────────────────────
export const useDeleteDoctor = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => doctorsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: doctorKeys.lists() })
      qc.invalidateQueries({ queryKey: doctorKeys.lookup() })
    },
  })
}
