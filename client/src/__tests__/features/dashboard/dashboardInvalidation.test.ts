/**
 * O scriere care schimbă cifrele de pe dashboard (programare, consultație, plată,
 * factură) trebuie să-l invalideze — altfel utilizatorul vede valori vechi până
 * la expirarea staleTime.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'
import { dashboardKeys } from '@/features/dashboard/hooks/useDashboard'
import { appointmentKeys, useCreateAppointment } from '@/features/appointments/hooks/useAppointments'
import { useFinalizeConsultation, useUpdateConsultation } from '@/features/consultations/hooks/useConsultations'
import { useCancelPayment } from '@/features/billing/hooks/useBilling'
import { useStornoInvoice } from '@/features/invoices/hooks/useInvoices'
import type { UpdateConsultationPayload } from '@/features/consultations/types/consultation.types'
import type { StornoInvoicePayload } from '@/features/invoices/types/invoice.types'

vi.mock('@/api/endpoints/appointments.api', () => ({
  appointmentsApi: { create: vi.fn(() => Promise.resolve({ success: true, data: 'id' })) },
}))
vi.mock('@/api/endpoints/consultations.api', () => ({
  consultationsApi: {
    update: vi.fn(() => Promise.resolve({ success: true, data: true })),
    finalize: vi.fn(() => Promise.resolve({ success: true, data: true })),
  },
}))
vi.mock('@/api/endpoints/billing.api', () => ({
  billingApi: { cancelPayment: vi.fn(() => Promise.resolve({ success: true, data: true })) },
  consultationServicesApi: {},
}))
vi.mock('@/api/endpoints/invoices.api', () => ({
  invoicesApi: { storno: vi.fn(() => Promise.resolve({ success: true, data: 'id' })) },
}))

let qc: QueryClient
const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children)

async function expectDashboardInvalidated<V>(
  useHook: () => { mutateAsync: (vars: V) => Promise<unknown> },
  vars: V,
) {
  const spy = vi.spyOn(qc, 'invalidateQueries')
  const { result } = renderHook(useHook, { wrapper })

  await act(() => result.current.mutateAsync(vars))

  const keys = spy.mock.calls.map(([filters]) => JSON.stringify(filters?.queryKey))
  expect(keys).toContain(JSON.stringify(dashboardKeys.all))
}

describe('dashboard invalidation', () => {
  beforeEach(() => {
    qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  })

  it('should invalidate dashboard after creating an appointment', () =>
    expectDashboardInvalidated(useCreateAppointment, {}))

  it('should invalidate dashboard after updating a consultation', () =>
    expectDashboardInvalidated(useUpdateConsultation, { id: 'c1' } as UpdateConsultationPayload))

  it('should invalidate dashboard after cancelling a payment', () =>
    expectDashboardInvalidated(useCancelPayment, { id: 'p1', reason: 'test' }))

  it('should invalidate dashboard after a storno invoice', () =>
    expectDashboardInvalidated(useStornoInvoice, { id: 'i1', reason: 'test' } as StornoInvoicePayload))

  it('should invalidate dashboard and appointments after finalizing a consultation', async () => {
    await expectDashboardInvalidated(useFinalizeConsultation, 'c1')
    const keys = vi.mocked(qc.invalidateQueries).mock.calls.map(([f]) => JSON.stringify(f?.queryKey))
    expect(keys).toContain(JSON.stringify(appointmentKeys.all))
  })
})
