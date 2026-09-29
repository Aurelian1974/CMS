import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { investigationsApi } from '@/api/endpoints/investigations.api'
import { billingKeys } from '@/features/billing/hooks/useBilling'
import type {
  CreateInvestigationPayload,
  UpdateInvestigationPayload,
} from '../types/investigation.types'

export const investigationKeys = {
  all: ['investigations'] as const,
  byConsultation: (consultationId: string) =>
    [...investigationKeys.all, 'by-consultation', consultationId] as const,
  byPatient: (patientId: string, type?: string) =>
    [...investigationKeys.all, 'by-patient', patientId, type ?? null] as const,
  detail: (id: string) => [...investigationKeys.all, 'detail', id] as const,
  trending: (patientId: string, type: string, jsonPath: string) =>
    [...investigationKeys.all, 'trending', patientId, type, jsonPath] as const,
  types: (specialty?: string) => ['investigation-types', specialty ?? '_all'] as const,
}

export const useInvestigationsByConsultation = (consultationId: string, enabled = true) =>
  useQuery({
    queryKey: investigationKeys.byConsultation(consultationId),
    queryFn: () => investigationsApi.getByConsultation(consultationId),
    enabled: !!consultationId && enabled,
  })

export const useInvestigationTypes = (specialty?: string) =>
  useQuery({
    queryKey: investigationKeys.types(specialty),
    queryFn: () => investigationsApi.getTypes(specialty),
    staleTime: 5 * 60 * 1000,
  })

export const useInvestigationTrending = (
  patientId: string,
  type: string,
  jsonPath: string,
  enabled = true,
) =>
  useQuery({
    queryKey: investigationKeys.trending(patientId, type, jsonPath),
    queryFn: () => investigationsApi.getTrending({ patientId, type, jsonPath }),
    enabled: !!patientId && !!type && !!jsonPath && enabled,
  })

// Serverul generează / elimină linia de serviciu legată de investigație în aceeași tranzacție
const invalidateAfterChange = (qc: QueryClient, consultationId: string) => Promise.all([
  qc.invalidateQueries({ queryKey: investigationKeys.byConsultation(consultationId) }),
  qc.invalidateQueries({ queryKey: billingKeys.all }),
])

export const useCreateInvestigation = (consultationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateInvestigationPayload) => investigationsApi.create(payload),
    onSuccess: () => invalidateAfterChange(qc, consultationId),
  })
}

export const useUpdateInvestigation = (consultationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateInvestigationPayload) => investigationsApi.update(payload),
    onSuccess: () => invalidateAfterChange(qc, consultationId),
  })
}

export const useDeleteInvestigation = (consultationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => investigationsApi.delete(id),
    onSuccess: () => invalidateAfterChange(qc, consultationId),
  })
}
