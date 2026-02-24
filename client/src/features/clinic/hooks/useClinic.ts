import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clinicApi } from '@/api/endpoints/clinic.api'
import type {
  UpdateClinicPayload,
  CreateClinicLocationPayload,
  UpdateClinicLocationPayload,
} from '@/features/clinic/types/clinic.types'

// ===== Query keys ierarhice =====
export const clinicKeys = {
  all:       ['clinic'] as const,
  current:   () => [...clinicKeys.all, 'current'] as const,
  locations: () => [...clinicKeys.all, 'locations'] as const,
}

/// Date clinică curentă
export const useCurrentClinic = () =>
  useQuery({
    queryKey: clinicKeys.current(),
    queryFn: () => clinicApi.getCurrentClinic(),
    staleTime: 10 * 60 * 1000,
  })

/// Locații clinică curentă
export const useClinicLocations = (isActive?: boolean) =>
  useQuery({
    queryKey: [...clinicKeys.locations(), { isActive }] as const,
    queryFn: () => clinicApi.getLocations(isActive),
    staleTime: 10 * 60 * 1000,
  })

/// Actualizare clinică
export const useUpdateClinic = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateClinicPayload) =>
      clinicApi.updateCurrentClinic(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicKeys.current() })
    },
  })
}

/// Creare locație
export const useCreateClinicLocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateClinicLocationPayload) =>
      clinicApi.createLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicKeys.locations() })
    },
  })
}

/// Actualizare locație
export const useUpdateClinicLocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateClinicLocationPayload) =>
      clinicApi.updateLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicKeys.locations() })
    },
  })
}

/// Ștergere locație (soft delete)
export const useDeleteClinicLocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      clinicApi.deleteLocation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicKeys.locations() })
    },
  })
}
