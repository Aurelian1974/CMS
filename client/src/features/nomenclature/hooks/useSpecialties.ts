import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nomenclatureApi } from '@/api/endpoints/nomenclature.api'
import type {
  CreateSpecialtyPayload,
  UpdateSpecialtyPayload,
} from '@/features/nomenclature/types/specialty.types'

// ===== Query keys ierarhice =====
export const specialtyKeys = {
  all:  ['specialties'] as const,
  list: (isActive?: boolean) => [...specialtyKeys.all, 'list', { isActive }] as const,
  tree: (isActive?: boolean) => [...specialtyKeys.all, 'tree', { isActive }] as const,
  detail: (id: string) => [...specialtyKeys.all, 'detail', id] as const,
}

/// Lista flat de specializări
export const useSpecialties = (isActive?: boolean) =>
  useQuery({
    queryKey: specialtyKeys.list(isActive),
    queryFn: () => nomenclatureApi.getSpecialties(isActive),
    staleTime: 10 * 60 * 1000, // nomenclatoare — stale la 10 min
  })

/// Arbore ierarhic de specializări
export const useSpecialtyTree = (isActive?: boolean) =>
  useQuery({
    queryKey: specialtyKeys.tree(isActive),
    queryFn: () => nomenclatureApi.getSpecialtyTree(isActive),
    staleTime: 10 * 60 * 1000,
  })

/// Detalii specializare
export const useSpecialty = (id: string) =>
  useQuery({
    queryKey: specialtyKeys.detail(id),
    queryFn: () => nomenclatureApi.getSpecialtyById(id),
    enabled: !!id,
  })

/// Creare specializare
export const useCreateSpecialty = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateSpecialtyPayload) =>
      nomenclatureApi.createSpecialty(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialtyKeys.all })
    },
  })
}

/// Actualizare specializare
export const useUpdateSpecialty = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateSpecialtyPayload) =>
      nomenclatureApi.updateSpecialty(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialtyKeys.all })
    },
  })
}

/// Toggle activ/inactiv
export const useToggleSpecialty = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      nomenclatureApi.toggleSpecialty(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: specialtyKeys.all })
    },
  })
}
