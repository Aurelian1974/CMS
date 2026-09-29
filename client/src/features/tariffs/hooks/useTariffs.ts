import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { tariffsApi } from '@/api/endpoints/tariffs.api'
import type {
  AddMedicalServicePricePayload,
  CreateMedicalServicePayload,
  CreateVatRatePayload,
  GetMedicalServicesParams,
  ImportInvestigationServicesPayload,
  UpdateMedicalServicePayload,
  UpdateVatRatePayload,
} from '../types/tariff.types'

export const tariffKeys = {
  all:      ['tariffs'] as const,
  lists:    () => [...tariffKeys.all, 'list'] as const,
  list:     (params: GetMedicalServicesParams) => [...tariffKeys.lists(), params] as const,
  details:  () => [...tariffKeys.all, 'detail'] as const,
  detail:   (id: string) => [...tariffKeys.details(), id] as const,
  lookups:  () => [...tariffKeys.all, 'lookups'] as const,
  vatRates: () => [...tariffKeys.all, 'vat-rates'] as const,
  importableInvestigations: () => [...tariffKeys.all, 'importable-investigations'] as const,
}

// ── Queries ──────────────────────────────────────────────────────────────────
export const useMedicalServices = (params: GetMedicalServicesParams, enabled = true) =>
  useQuery({
    queryKey: tariffKeys.list(params),
    queryFn: () => tariffsApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    enabled,
  })

export const useMedicalService = (id: string | null) =>
  useQuery({
    queryKey: tariffKeys.detail(id ?? ''),
    queryFn: () => tariffsApi.getById(id!),
    enabled: !!id,
  })

export const useBillingLookups = () =>
  useQuery({
    queryKey: tariffKeys.lookups(),
    queryFn: () => tariffsApi.getLookups(),
    staleTime: 5 * 60_000,
  })

export const useVatRates = () =>
  useQuery({
    queryKey: tariffKeys.vatRates(),
    queryFn: () => tariffsApi.getVatRates(),
  })

export const useImportableInvestigationTypes = (enabled: boolean) =>
  useQuery({
    queryKey: tariffKeys.importableInvestigations(),
    queryFn: () => tariffsApi.getImportableInvestigationTypes(),
    enabled,
  })

// ── Mutations ────────────────────────────────────────────────────────────────
// Orice modificare de tarif poate schimba lista, detaliul și nomenclatoarele
const useTariffMutation = <TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => qc.invalidateQueries({ queryKey: tariffKeys.all }),
  })
}

export const useCreateMedicalService = () =>
  useTariffMutation((payload: CreateMedicalServicePayload) => tariffsApi.create(payload))

export const useUpdateMedicalService = () =>
  useTariffMutation((payload: UpdateMedicalServicePayload) => tariffsApi.update(payload))

export const useSetMedicalServiceActive = () =>
  useTariffMutation(({ id, isActive }: { id: string; isActive: boolean }) => tariffsApi.setActive(id, isActive))

export const useAddMedicalServicePrice = () =>
  useTariffMutation((payload: AddMedicalServicePricePayload) => tariffsApi.addPrice(payload))

export const useCreateVatRate = () =>
  useTariffMutation((payload: CreateVatRatePayload) => tariffsApi.createVatRate(payload))

export const useUpdateVatRate = () =>
  useTariffMutation((payload: UpdateVatRatePayload) => tariffsApi.updateVatRate(payload))

export const useImportInvestigationServices = () =>
  useTariffMutation((payload: ImportInvestigationServicesPayload) => tariffsApi.importInvestigations(payload))
