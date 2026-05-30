import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { analysesResultsApi } from '@/api/endpoints/analysesResults.api'
import type {
  CreateAnalysesResultPayload,
  UpdateAnalysesResultPayload,
} from '../types/analysesResults.types'

export const analysesResultKeys = {
  all: ['analysesResults'] as const,
  byConsultation: (consultationId: string) =>
    [...analysesResultKeys.all, 'consultation', consultationId] as const,
  byPatient: (patientId: string) =>
    [...analysesResultKeys.all, 'patient', patientId] as const,
  detail: (id: string) => [...analysesResultKeys.all, 'detail', id] as const,
}

export const useAnalysesResultsByConsultation = (consultationId: string) =>
  useQuery({
    queryKey: analysesResultKeys.byConsultation(consultationId),
    queryFn: () => analysesResultsApi.getByConsultation(consultationId),
    enabled: !!consultationId,
    staleTime: 2 * 60 * 1000,
  })

export const useAnalysesResultDetail = (id: string | null) =>
  useQuery({
    queryKey: analysesResultKeys.detail(id ?? ''),
    queryFn: () => analysesResultsApi.getById(id!),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  })

export const useCreateAnalysesResult = (consultationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateAnalysesResultPayload) => analysesResultsApi.create(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: analysesResultKeys.byConsultation(consultationId) })
    },
  })
}

export const useUpdateAnalysesResult = (consultationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateAnalysesResultPayload }) =>
      analysesResultsApi.update(id, payload),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: analysesResultKeys.byConsultation(consultationId) })
      qc.invalidateQueries({ queryKey: analysesResultKeys.detail(variables.id) })
    },
  })
}

export const useDeleteAnalysesResult = (consultationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => analysesResultsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: analysesResultKeys.byConsultation(consultationId) })
    },
  })
}
