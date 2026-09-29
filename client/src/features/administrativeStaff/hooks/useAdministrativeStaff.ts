import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { administrativeStaffApi } from '@/api/endpoints/administrativeStaff.api'
import type {
  GetAdministrativeStaffParams,
  CreateAdministrativeStaffPayload,
  UpdateAdministrativeStaffPayload,
} from '../types/administrativeStaff.types'

// ── Query Keys ────────────────────────────────────────────────────────────────
export const administrativeStaffKeys = {
  all:       ['administrativeStaff'] as const,
  lists:     () => [...administrativeStaffKeys.all, 'list'] as const,
  list:      (params: GetAdministrativeStaffParams) => [...administrativeStaffKeys.lists(), params] as const,
  lookup:    () => [...administrativeStaffKeys.all, 'lookup'] as const,
  positions: () => [...administrativeStaffKeys.all, 'positions'] as const,
  details:   () => [...administrativeStaffKeys.all, 'detail'] as const,
  detail:    (id: string) => [...administrativeStaffKeys.details(), id] as const,
}

// ── Listare paginată ──────────────────────────────────────────────────────────
export const useAdministrativeStaffList = (params: GetAdministrativeStaffParams) =>
  useQuery({
    queryKey: administrativeStaffKeys.list(params),
    queryFn: () => administrativeStaffApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

// ── Lookup (dropdown asociere cont) ───────────────────────────────────────────
export const useAdministrativeStaffLookup = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: administrativeStaffKeys.lookup(),
    queryFn: () => administrativeStaffApi.getLookup(),
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  })

// ── Nomenclator funcții ──────────────────────────────────────────────────────
export const useAdministrativePositions = () =>
  useQuery({
    queryKey: administrativeStaffKeys.positions(),
    queryFn: () => administrativeStaffApi.getPositions(),
    staleTime: Infinity,
  })

// ── Detaliu ──────────────────────────────────────────────────────────────────
export const useAdministrativeStaffDetail = (id: string) =>
  useQuery({
    queryKey: administrativeStaffKeys.detail(id),
    queryFn: () => administrativeStaffApi.getById(id),
    enabled: !!id,
  })

// ── Mutații — invalidează și lookup-ul folosit la asocierea conturilor ───────
export const useCreateAdministrativeStaff = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAdministrativeStaffPayload) => administrativeStaffApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: administrativeStaffKeys.lists() })
      qc.invalidateQueries({ queryKey: administrativeStaffKeys.lookup() })
    },
  })
}

export const useUpdateAdministrativeStaff = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateAdministrativeStaffPayload) => administrativeStaffApi.update(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: administrativeStaffKeys.all })
    },
  })
}

export const useDeleteAdministrativeStaff = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => administrativeStaffApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: administrativeStaffKeys.lists() })
      qc.invalidateQueries({ queryKey: administrativeStaffKeys.lookup() })
    },
  })
}
