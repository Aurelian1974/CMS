import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { analysesDictApi, labApi, recommendedAnalysesApi } from '@/api/endpoints/lab.api'
import type {
  CreateRecommendedAnalysisPayload,
  UpdateRecommendedAnalysisPayload,
} from '../types/lab.types'

export const labKeys = {
  all: ['lab'] as const,
  parse: ['lab', 'parse'] as const,
}

export const recommendedKeys = {
  all: ['recommended-analyses'] as const,
  byConsultation: (consultationId: string) =>
    [...recommendedKeys.all, 'by-consultation', consultationId] as const,
}

export const analysesDictKeys = {
  search: (q: string) => ['analyses-dict', 'search', q] as const,
}

// ── Parse PDF (mutație, nu query) ─────────────────────────────────────────
export const useParseLabPdf = () =>
  useMutation({
    mutationFn: (file: File) => labApi.parsePdf(file),
  })

// ── Recommended ────────────────────────────────────────────────────────────
export const useRecommendedAnalyses = (consultationId: string, enabled = true) =>
  useQuery({
    queryKey: recommendedKeys.byConsultation(consultationId),
    queryFn: () => recommendedAnalysesApi.getByConsultation(consultationId),
    enabled: !!consultationId && enabled,
  })

export const useCreateRecommendedAnalysis = (consultationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateRecommendedAnalysisPayload) => recommendedAnalysesApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: recommendedKeys.byConsultation(consultationId) }),
  })
}

export const useUpdateRecommendedAnalysis = (consultationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UpdateRecommendedAnalysisPayload) => recommendedAnalysesApi.update(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: recommendedKeys.byConsultation(consultationId) }),
  })
}

export const useDeleteRecommendedAnalysis = (consultationId: string) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => recommendedAnalysesApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: recommendedKeys.byConsultation(consultationId) }),
  })
}

// ── Analyses dictionary search ─────────────────────────────────────────────
export const useSearchAnalyses = (q: string, enabled = true) =>
  useQuery({
    queryKey: analysesDictKeys.search(q),
    queryFn: () => analysesDictApi.search(q),
    enabled: enabled && q.trim().length >= 2,
    staleTime: 60_000,
  })
