import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { financialSettingsApi } from '@/api/endpoints/financialSettings.api'
import type {
  CreateInvoiceSeriesPayload,
  UpdateFiscalSettingsPayload,
  UpdateInvoiceSeriesPayload,
} from '../types/financialSettings.types'

export const financialSettingsKeys = {
  all:    ['financial-settings'] as const,
  fiscal: () => [...financialSettingsKeys.all, 'fiscal'] as const,
  series: () => [...financialSettingsKeys.all, 'invoice-series'] as const,
}

// Seriile și statutul TVA apar și în nomenclatoarele de facturare (tarife)
const TARIFFS_KEY = ['tariffs'] as const

export const useFiscalSettings = (enabled = true) =>
  useQuery({
    queryKey: financialSettingsKeys.fiscal(),
    queryFn: () => financialSettingsApi.getFiscal(),
    staleTime: 60_000,
    enabled,
  })

export const useInvoiceSeries = () =>
  useQuery({
    queryKey: financialSettingsKeys.series(),
    queryFn: () => financialSettingsApi.getInvoiceSeries(),
  })

const useSettingsMutation = <TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: financialSettingsKeys.all }),
      qc.invalidateQueries({ queryKey: TARIFFS_KEY }),
    ]),
  })
}

export const useUpdateFiscalSettings = () =>
  useSettingsMutation((payload: UpdateFiscalSettingsPayload) => financialSettingsApi.updateFiscal(payload))

export const useCreateInvoiceSeries = () =>
  useSettingsMutation((payload: CreateInvoiceSeriesPayload) => financialSettingsApi.createInvoiceSeries(payload))

export const useUpdateInvoiceSeries = () =>
  useSettingsMutation((payload: UpdateInvoiceSeriesPayload) => financialSettingsApi.updateInvoiceSeries(payload))
