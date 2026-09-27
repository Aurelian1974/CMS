import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { billingApi, consultationServicesApi } from '@/api/endpoints/billing.api'
import { consultationKeys } from '@/features/consultations/hooks/useConsultations'
import { invoiceKeys } from '@/features/invoices/hooks/useInvoices'
import type {
  CreatePaymentPayload,
  GetBillingConsultationsParams,
  ReconcileFiscalReceiptPayload,
  ReportFiscalReceiptResultPayload,
} from '../types/billing.types'

export const billingKeys = {
  all:           ['billing'] as const,
  lists:         () => [...billingKeys.all, 'list'] as const,
  list:          (params: GetBillingConsultationsParams) => [...billingKeys.lists(), params] as const,
  consultations: () => [...billingKeys.all, 'consultation'] as const,
  consultation:  (id: string) => [...billingKeys.consultations(), id] as const,
  receipts:      () => [...billingKeys.all, 'receipt'] as const,
  receipt:       (id: string) => [...billingKeys.receipts(), id] as const,
  services:      (consultationId: string) => [...billingKeys.all, 'services', consultationId] as const,
}

/**
 * Orice operație financiară poate schimba totalul, statusul de plată, statusul consultației
 * (FINALIZATA ↔ FACTURATA) și lista de facturi — invalidăm tot ce depinde de ele.
 */
const invalidateBilling = (qc: QueryClient) => Promise.all([
  qc.invalidateQueries({ queryKey: billingKeys.all }),
  qc.invalidateQueries({ queryKey: invoiceKeys.all }),
  qc.invalidateQueries({ queryKey: consultationKeys.all }),
])

// ── Queries ──────────────────────────────────────────────────────────────────
export const useBillingConsultations = (params: GetBillingConsultationsParams) =>
  useQuery({
    queryKey: billingKeys.list(params),
    queryFn: () => billingApi.getConsultations(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  })

export const useConsultationBilling = (consultationId: string | null) =>
  useQuery({
    queryKey: billingKeys.consultation(consultationId ?? ''),
    queryFn: () => billingApi.getConsultation(consultationId!),
    enabled: !!consultationId,
  })

export const useFiscalReceipt = (id: string | null) =>
  useQuery({
    queryKey: billingKeys.receipt(id ?? ''),
    queryFn: () => billingApi.getFiscalReceipt(id!),
    enabled: !!id,
  })

export const useConsultationServices = (consultationId: string | null) =>
  useQuery({
    queryKey: billingKeys.services(consultationId ?? ''),
    queryFn: () => consultationServicesApi.getByConsultation(consultationId!),
    enabled: !!consultationId,
  })

// ── Mutations ────────────────────────────────────────────────────────────────
const useBillingMutation = <TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) => {
  const qc = useQueryClient()
  return useMutation({ mutationFn, onSuccess: () => invalidateBilling(qc) })
}

type AddServiceVars = { consultationId: string; medicalServiceId: string; quantity: number }
type QuantityVars = { id: string; quantity: number }

/** Linii de servicii — din recepție (modulul payments). */
export const useBillingServiceMutations = () => ({
  add:    useBillingMutation((v: AddServiceVars) => billingApi.addService(v.consultationId, v.medicalServiceId, v.quantity)),
  update: useBillingMutation((v: QuantityVars) => billingApi.updateServiceQuantity(v.id, v.quantity)),
  remove: useBillingMutation((id: string) => billingApi.deleteService(id)),
})

/** Linii de servicii — din fișa consultației (modulul consultations). */
export const useConsultationServiceMutations = () => ({
  add:    useBillingMutation((v: AddServiceVars) => consultationServicesApi.add(v.consultationId, v.medicalServiceId, v.quantity)),
  update: useBillingMutation((v: QuantityVars) => consultationServicesApi.updateQuantity(v.id, v.quantity)),
  remove: useBillingMutation((id: string) => consultationServicesApi.delete(id)),
})

export const useCreatePayment = () =>
  useBillingMutation((payload: CreatePaymentPayload) => billingApi.createPayment(payload))

export const useCancelPayment = () =>
  useBillingMutation(({ id, reason }: { id: string; reason: string }) => billingApi.cancelPayment(id, reason))

export const useStartFiscalReceipt = () =>
  useBillingMutation((id: string) => billingApi.startFiscalReceipt(id))

export const useReportFiscalReceiptResult = () =>
  useBillingMutation((payload: ReportFiscalReceiptResultPayload) => billingApi.reportFiscalReceiptResult(payload))

export const useReconcileFiscalReceipt = () =>
  useBillingMutation((payload: ReconcileFiscalReceiptPayload) => billingApi.reconcileFiscalReceipt(payload))
