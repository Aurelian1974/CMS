import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { invoicesApi } from '@/api/endpoints/invoices.api'
import type { CreateInvoicePayload, GetInvoicesParams, StornoInvoicePayload } from '../types/invoice.types'

export const invoiceKeys = {
  all:     ['invoices'] as const,
  lists:   () => [...invoiceKeys.all, 'list'] as const,
  list:    (params: GetInvoicesParams) => [...invoiceKeys.lists(), params] as const,
  details: () => [...invoiceKeys.all, 'detail'] as const,
  detail:  (id: string) => [...invoiceKeys.details(), id] as const,
}

// Emiterea / stornarea schimbă și situația financiară a consultației
const BILLING_KEY = ['billing'] as const
const CONSULTATIONS_KEY = ['consultations'] as const

export const useInvoices = (params: GetInvoicesParams) =>
  useQuery({
    queryKey: invoiceKeys.list(params),
    queryFn: () => invoicesApi.getAll(params),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

export const useInvoice = (id: string | null) =>
  useQuery({
    queryKey: invoiceKeys.detail(id ?? ''),
    queryFn: () => invoicesApi.getById(id!),
    enabled: !!id,
  })

const useInvoiceMutation = <TVars, TResult>(mutationFn: (vars: TVars) => Promise<TResult>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => Promise.all([
      qc.invalidateQueries({ queryKey: invoiceKeys.all }),
      qc.invalidateQueries({ queryKey: BILLING_KEY }),
      qc.invalidateQueries({ queryKey: CONSULTATIONS_KEY }),
    ]),
  })
}

export const useCreateInvoice = () =>
  useInvoiceMutation((payload: CreateInvoicePayload) => invoicesApi.create(payload))

export const useStornoInvoice = () =>
  useInvoiceMutation((payload: StornoInvoicePayload) => invoicesApi.storno(payload))
