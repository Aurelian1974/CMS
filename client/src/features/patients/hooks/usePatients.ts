import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { patientsApi } from '@/api/endpoints/patients.api'
import type {
  GetPatientsParams,
  CreatePatientPayload,
  UpdatePatientPayload,
} from '../types/patient.types'

// ── Query Keys ────────────────────────────────────────────────────────────────
export const patientKeys = {
  all:     ['patients'] as const,
  lists:   () => [...patientKeys.all, 'list'] as const,
  list:    (params: GetPatientsParams) => [...patientKeys.lists(), params] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail:  (id: string) => [...patientKeys.details(), id] as const,
}

// ── Listare paginată ──────────────────────────────────────────────────────────
export const usePatients = (params: GetPatientsParams) =>
  useQuery({
    queryKey: patientKeys.list(params),
    queryFn: () => patientsApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000,
  })

// ── Detaliu pacient cu sub-colecții ───────────────────────────────────────────
export const usePatientDetail = (id: string, enabled = true) =>
  useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => patientsApi.getById(id),
    enabled: !!id && enabled,
  })

// ── Creare pacient ────────────────────────────────────────────────────────────
export const useCreatePatient = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreatePatientPayload) => patientsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientKeys.lists() })
    },
  })
}

// ── Actualizare pacient ───────────────────────────────────────────────────────
export const useUpdatePatient = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdatePatientPayload) => patientsApi.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientKeys.all })
    },
  })
}

// ── Ștergere pacient (soft delete) ────────────────────────────────────────────
export const useDeletePatient = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: patientKeys.lists() })
    },
  })
}
