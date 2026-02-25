import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { nomenclatureApi } from '@/api/endpoints/nomenclature.api'
import type {
  CreateMedicalTitlePayload,
  UpdateMedicalTitlePayload,
} from '@/features/nomenclature/types/medicalTitle.types'

// ===== Query keys ierarhice =====
export const medicalTitleKeys = {
  all:  ['medicalTitles'] as const,
  list: (isActive?: boolean) => [...medicalTitleKeys.all, 'list', { isActive }] as const,
}

/// Lista de titulaturi medicale
export const useMedicalTitles = (isActive?: boolean) =>
  useQuery({
    queryKey: medicalTitleKeys.list(isActive),
    queryFn: () => nomenclatureApi.getMedicalTitles(isActive),
    staleTime: 10 * 60 * 1000, // nomenclatoare — stale la 10 min
  })

/// Creare titulatură
export const useCreateMedicalTitle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateMedicalTitlePayload) =>
      nomenclatureApi.createMedicalTitle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicalTitleKeys.all })
    },
  })
}

/// Actualizare titulatură
export const useUpdateMedicalTitle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateMedicalTitlePayload) =>
      nomenclatureApi.updateMedicalTitle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicalTitleKeys.all })
    },
  })
}

/// Toggle activ/inactiv
export const useToggleMedicalTitle = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      nomenclatureApi.toggleMedicalTitle(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: medicalTitleKeys.all })
    },
  })
}
