import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { cnasApi } from '@/api/endpoints/cnas.api'
import type {
  GetCnasDrugsParams,
  GetCnasCompensatedParams,
  GetCnasPagedParams,
} from '@/features/cnas/types/cnas.types'

export const cnasKeys = {
  all:              ['cnas'] as const,
  stats:            () => [...cnasKeys.all, 'stats'] as const,
  history:          () => [...cnasKeys.all, 'history'] as const,
  status:           (jobId: string) => [...cnasKeys.all, 'status', jobId] as const,
  drugs:            () => [...cnasKeys.all, 'drugs'] as const,
  drug:             (params: GetCnasDrugsParams) => [...cnasKeys.drugs(), params] as const,
  compensated:      () => [...cnasKeys.all, 'compensated'] as const,
  compensatedList:  (params: GetCnasCompensatedParams) => [...cnasKeys.compensated(), params] as const,
  activeSubstances: () => [...cnasKeys.all, 'activeSubstances'] as const,
  activeSubst:      (params: GetCnasPagedParams) => [...cnasKeys.activeSubstances(), params] as const,
  atc:              () => [...cnasKeys.all, 'atc'] as const,
  atcList:          (params: GetCnasPagedParams) => [...cnasKeys.atc(), params] as const,
  icd10:            () => [...cnasKeys.all, 'icd10'] as const,
  icd10List:        (params: GetCnasPagedParams) => [...cnasKeys.icd10(), params] as const,
}

/** Statistici nomenclator (număr medicamente, ultima sincronizare). */
export const useCnasStats = () =>
  useQuery({
    queryKey: cnasKeys.stats(),
    queryFn: () => cnasApi.getStats(),
    staleTime: 5 * 60 * 1000,
  })

/** Istoricul sincronizărilor. */
export const useCnasSyncHistory = (count = 10) =>
  useQuery({
    queryKey: [...cnasKeys.history(), count] as const,
    queryFn: () => cnasApi.getSyncHistory(count),
    staleTime: 30_000,
  })

/** Statusul unui job de sincronizare — polling activ cât timp Status = "Running". */
export const useCnasSyncStatus = (jobId: string | null) =>
  useQuery({
    queryKey: cnasKeys.status(jobId ?? ''),
    queryFn: () => cnasApi.getSyncStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status
      return status === 'Running' ? 3_000 : false
    },
    staleTime: 0,
  })

/** Declanșează sincronizare manuală. */
export const useTriggerCnasSync = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => cnasApi.triggerSync(),
    onSuccess: () => {
      // Invalidează tot cache-ul CNAS — sincronizarea schimbă nomenclatoarele și istoricul
      queryClient.invalidateQueries({ queryKey: cnasKeys.all })
    },
  })
}

// ── Nomenclator ───────────────────────────────────────────────────────────────

export const useCnasDrugs = (params: GetCnasDrugsParams) =>
  useQuery({
    queryKey: cnasKeys.drug(params),
    queryFn: () => cnasApi.getDrugs(params),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  })

export const useCnasCompensated = (params: GetCnasCompensatedParams) =>
  useQuery({
    queryKey: cnasKeys.compensatedList(params),
    queryFn: () => cnasApi.getCompensated(params),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  })

export const useCnasActiveSubstances = (params: GetCnasPagedParams) =>
  useQuery({
    queryKey: cnasKeys.activeSubst(params),
    queryFn: () => cnasApi.getActiveSubstances(params),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  })

export const useCnasAtcCodes = (params: GetCnasPagedParams) =>
  useQuery({
    queryKey: cnasKeys.atcList(params),
    queryFn: () => cnasApi.getAtcCodes(params),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  })

export const useCnasIcd10Codes = (params: GetCnasPagedParams) =>
  useQuery({
    queryKey: cnasKeys.icd10List(params),
    queryFn: () => cnasApi.getIcd10Codes(params),
    placeholderData: keepPreviousData,
    staleTime: Infinity,
  })
