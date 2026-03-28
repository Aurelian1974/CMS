import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { anmApi } from '@/api/endpoints/anm.api'
import type { GetAnmDrugsParams } from '@/features/anm/types/anm.types'

export const anmKeys = {
  all:     ['anm'] as const,
  stats:   () => [...anmKeys.all, 'stats'] as const,
  history: () => [...anmKeys.all, 'history'] as const,
  status:  (jobId: string) => [...anmKeys.all, 'status', jobId] as const,
  drugs:   () => [...anmKeys.all, 'drugs'] as const,
  drug:    (params: GetAnmDrugsParams) => [...anmKeys.drugs(), params] as const,
}

export const useAnmStats = () =>
  useQuery({
    queryKey: anmKeys.stats(),
    queryFn: () => anmApi.getStats(),
    staleTime: 5 * 60 * 1000,
  })

export const useAnmSyncHistory = (count = 10) =>
  useQuery({
    queryKey: [...anmKeys.history(), count] as const,
    queryFn: () => anmApi.getSyncHistory(count),
    staleTime: 30_000,
  })

export const useAnmSyncStatus = (jobId: string | null) =>
  useQuery({
    queryKey: anmKeys.status(jobId ?? ''),
    queryFn: () => anmApi.getSyncStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status
      return status === 'Running' ? 3_000 : false
    },
  })

export const useAnmDrugs = (params: GetAnmDrugsParams) =>
  useQuery({
    queryKey: anmKeys.drug(params),
    queryFn: () => anmApi.getDrugs(params),
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
  })

export const useTriggerAnmSync = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => anmApi.triggerSync(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: anmKeys.stats() })
      qc.invalidateQueries({ queryKey: anmKeys.history() })
    },
  })
}
