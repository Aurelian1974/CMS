import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clinicApi } from '@/api/endpoints/clinic.api'
import type {
  UpdateClinicPayload,
  SyncClinicCaenCodesPayload,
  CreateClinicLocationPayload,
  UpdateClinicLocationPayload,
  CreateClinicBankAccountPayload,
  UpdateClinicBankAccountPayload,
  CreateClinicAddressPayload,
  UpdateClinicAddressPayload,
  CreateClinicContactPayload,
  UpdateClinicContactPayload,
  CreateClinicContactPersonPayload,
  UpdateClinicContactPersonPayload,
} from '@/features/clinic/types/clinic.types'

// ===== Query keys ierarhice =====
export const clinicKeys = {
  all:       ['clinic'] as const,
  current:   () => [...clinicKeys.all, 'current'] as const,
  locations: () => [...clinicKeys.all, 'locations'] as const,
}

/// Date clinică curentă (include bankAccounts, addresses, contacts)
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

/// Actualizare clinică (date generale)
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

/// Sincronizare coduri CAEN
export const useSyncClinicCaenCodes = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: SyncClinicCaenCodesPayload) =>
      clinicApi.syncCaenCodes(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: clinicKeys.current() })
    },
  })
}

// ===== Conturi bancare =====

export const useCreateBankAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateClinicBankAccountPayload) =>
      clinicApi.createBankAccount(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicKeys.current() }),
  })
}

export const useUpdateBankAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateClinicBankAccountPayload) =>
      clinicApi.updateBankAccount(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicKeys.current() }),
  })
}

export const useDeleteBankAccount = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clinicApi.deleteBankAccount(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicKeys.current() }),
  })
}

// ===== Adrese =====

export const useCreateAddress = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateClinicAddressPayload) =>
      clinicApi.createAddress(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicKeys.current() }),
  })
}

export const useUpdateAddress = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateClinicAddressPayload) =>
      clinicApi.updateAddress(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicKeys.current() }),
  })
}

export const useDeleteAddress = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clinicApi.deleteAddress(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicKeys.current() }),
  })
}

// ===== Date de contact =====

export const useCreateContact = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateClinicContactPayload) =>
      clinicApi.createContact(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicKeys.current() }),
  })
}

export const useUpdateContact = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateClinicContactPayload) =>
      clinicApi.updateContact(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicKeys.current() }),
  })
}

export const useDeleteContact = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clinicApi.deleteContact(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicKeys.current() }),
  })
}

// ===== Persoane de contact =====

export const useCreateContactPerson = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateClinicContactPersonPayload) =>
      clinicApi.createContactPerson(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicKeys.current() }),
  })
}

export const useUpdateContactPerson = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateClinicContactPersonPayload) =>
      clinicApi.updateContactPerson(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicKeys.current() }),
  })
}

export const useDeleteContactPerson = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clinicApi.deleteContactPerson(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clinicKeys.current() }),
  })
}

// ===== Locații =====

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

