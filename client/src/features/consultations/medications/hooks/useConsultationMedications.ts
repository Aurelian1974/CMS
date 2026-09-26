import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { consultationMedicationsApi } from '@/api/endpoints/consultationMedications.api'
import type {
  CreateConsultationMedicationPayload,
  UpdateConsultationMedicationPayload,
} from '../types/medication.types'

export const DRUG_SEARCH_MIN_LENGTH = 2

export const consultationMedicationKeys = {
  all: ['consultation-medications'] as const,
  byConsultation: (consultationId: string) =>
    [...consultationMedicationKeys.all, 'by-consultation', consultationId] as const,
  drugSearch: (search: string) =>
    [...consultationMedicationKeys.all, 'drug-search', search] as const,
}

export const useConsultationMedications = (consultationId: string) =>
  useQuery({
    queryKey: consultationMedicationKeys.byConsultation(consultationId),
    queryFn: () => consultationMedicationsApi.getByConsultation(consultationId),
    enabled: !!consultationId,
  })

export const useCnasDrugSearch = (search: string) => {
  const term = search.trim()
  return useQuery({
    queryKey: consultationMedicationKeys.drugSearch(term),
    queryFn: () => consultationMedicationsApi.searchDrugs(term),
    enabled: term.length >= DRUG_SEARCH_MIN_LENGTH,
    staleTime: 5 * 60_000,
  })
}

export const useCreateConsultationMedication = (consultationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateConsultationMedicationPayload) => consultationMedicationsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: consultationMedicationKeys.byConsultation(consultationId) }),
  })
}

export const useUpdateConsultationMedication = (consultationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateConsultationMedicationPayload) => consultationMedicationsApi.update(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: consultationMedicationKeys.byConsultation(consultationId) }),
  })
}

export const useDeleteConsultationMedication = (consultationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => consultationMedicationsApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: consultationMedicationKeys.byConsultation(consultationId) }),
  })
}
