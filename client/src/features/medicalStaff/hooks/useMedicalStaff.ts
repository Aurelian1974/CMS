import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { medicalStaffApi } from '@/api/endpoints/medicalStaff.api'
import type {
  GetMedicalStaffParams,
  CreateMedicalStaffPayload,
  UpdateMedicalStaffPayload,
} from '../types/medicalStaff.types'

// ── Query Keys ────────────────────────────────────────────────────────────────
export const medicalStaffKeys = {
  all:     ['medicalStaff'] as const,
  lists:   () => [...medicalStaffKeys.all, 'list'] as const,
  list:    (params: GetMedicalStaffParams) => [...medicalStaffKeys.lists(), params] as const,  lookup:  () => [...medicalStaffKeys.all, 'lookup'] as const,  details: () => [...medicalStaffKeys.all, 'detail'] as const,
  detail:  (id: string) => [...medicalStaffKeys.details(), id] as const,
}

// ── Listare paginată ──────────────────────────────────────────────────────────
export const useMedicalStaffList = (params: GetMedicalStaffParams) =>
  useQuery({
    queryKey: medicalStaffKeys.list(params),
    queryFn: () => medicalStaffApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000,
  })
// ── Lookup (dropdown / departamente) ───────────────────────────────────────────────────
export const useMedicalStaffLookup = () =>
  useQuery({
    queryKey: medicalStaffKeys.lookup(),
    queryFn: () => medicalStaffApi.getLookup(),
    staleTime: 5 * 60 * 1000,
  })
// ── Detaliu personal medical ──────────────────────────────────────────────────
export const useMedicalStaffDetail = (id: string) =>
  useQuery({
    queryKey: medicalStaffKeys.detail(id),
    queryFn: () => medicalStaffApi.getById(id),
    enabled: !!id,
  })

// ── Creare personal medical ───────────────────────────────────────────────────
export const useCreateMedicalStaff = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMedicalStaffPayload) => medicalStaffApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: medicalStaffKeys.lists() })
    },
  })
}

// ── Actualizare personal medical ──────────────────────────────────────────────
export const useUpdateMedicalStaff = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateMedicalStaffPayload) => medicalStaffApi.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: medicalStaffKeys.all })
    },
  })
}

// ── Ștergere personal medical (soft delete) ───────────────────────────────────
export const useDeleteMedicalStaff = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => medicalStaffApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: medicalStaffKeys.lists() })
    },
  })
}
