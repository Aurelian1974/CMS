import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PatientFlowWidget } from '@/features/dashboard/components/widgets/PatientFlowWidget'
import type { DashboardDto, DashboardFlowItemDto } from '@/features/dashboard/types/dashboard.types'

let mockCanReadConsultations = true
let mockCanWritePayments = true

vi.mock('@/hooks/useHasAccess', () => ({
  MODULE: { Consultations: 'consultations', Payments: 'payments' },
  useHasAccess: () => ({
    canRead: (m: string) => m === 'consultations' && mockCanReadConsultations,
    canWrite: (m: string) => m === 'payments' && mockCanWritePayments,
  }),
}))

vi.mock('@/features/appointments/hooks/useCanChangeAppointmentStatus', () => ({
  useCanChangeAppointmentStatus: () => true,
}))

vi.mock('@/features/appointments/hooks/useAppointments', () => ({
  useAppointmentStatuses: () => ({ data: { data: [
    { id: 's2', code: 'CONFIRMAT', name: 'Confirmat', sortOrder: 2, blocksSlot: true, allowedNextCodes: 'PROGRAMAT,ANULAT,NEPREZENTARE' },
    { id: 's1', code: 'PROGRAMAT', name: 'Programat', sortOrder: 1, blocksSlot: true, allowedNextCodes: 'CONFIRMAT' },
    { id: 's4', code: 'ANULAT', name: 'Anulat', sortOrder: 4, blocksSlot: false, allowedNextCodes: 'PROGRAMAT' },
    { id: 's5', code: 'NEPREZENTARE', name: 'Neprezentare', sortOrder: 5, blocksSlot: false, allowedNextCodes: 'PROGRAMAT' },
  ] } }),
  useUpdateAppointmentStatus: () => ({ mutate: vi.fn(), isPending: false }),
}))

vi.mock('@/features/billing/components/ConsultationBillingModal', () => ({
  ConsultationBillingModal: ({ consultationId }: { consultationId: string | null }) =>
    consultationId ? <div role="dialog">Încasare {consultationId}</div> : null,
}))

const item = (overrides: Partial<DashboardFlowItemDto>): DashboardFlowItemDto => ({
  appointmentId: 'apt', consultationId: null, time: '2026-09-29T09:00:00',
  patientId: 'p', patientName: 'Pacient', doctorId: 'd', doctorName: 'Dr. Pop',
  appointmentStatusCode: 'CONFIRMAT', appointmentStatusName: 'Confirmat', consultationStatusCode: null,
  startedAt: null, stage: 'WAITING', amountDue: null,
  ...overrides,
})

const ITEMS: DashboardFlowItemDto[] = [
  item({ appointmentId: 'a1', patientName: 'Ana Neconfirmata', stage: 'TO_CONFIRM', appointmentStatusCode: 'PROGRAMAT' }),
  item({ appointmentId: 'a2', patientName: 'Bogdan Asteapta', stage: 'WAITING' }),
  item({ appointmentId: 'a3', consultationId: 'c3', patientName: 'Carmen Consult', stage: 'IN_CONSULTATION',
         consultationStatusCode: 'INLUCRU', startedAt: new Date(Date.now() - 25 * 60_000).toISOString() }),
  item({ appointmentId: 'a4', consultationId: 'c4', patientName: 'Dan Plata', stage: 'TO_PAY',
         consultationStatusCode: 'FINALIZATA', amountDue: 150 }),
  item({ appointmentId: null, consultationId: 'c5', patientName: 'Elena Walkin', stage: 'IN_CONSULTATION',
         consultationStatusCode: 'INLUCRU' }),
]

const renderWidget = (widgetIds: string[] = ['list.patient.flow.today']) =>
  render(
    <MemoryRouter>
      <PatientFlowWidget data={{ widgetIds, flow: { items: ITEMS } } as DashboardDto} />
    </MemoryRouter>,
  )

const stageButton = (name: RegExp) => screen.getByRole('button', { name })

describe('PatientFlowWidget', () => {
  beforeEach(() => {
    mockCanReadConsultations = true
    mockCanWritePayments = true
  })

  it('should show every stage with its count and open the waiting patients first', () => {
    renderWidget()

    expect(stageButton(/Neconfirmați\s*1/)).toBeInTheDocument()
    expect(stageButton(/În consultație\s*2/)).toBeInTheDocument()
    expect(stageButton(/Așteaptă\s*1/)).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByText('Bogdan Asteapta')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Anulează Bogdan Asteapta' })).toBeInTheDocument()
  })

  it('should hide the unconfirmed stage when the agenda widget already lists them', () => {
    renderWidget(['list.patient.flow.today', 'list.agenda.today'])

    expect(screen.queryByRole('button', { name: /Neconfirmați/ })).not.toBeInTheDocument()
  })

  it('should list patients in consultation, including walk-ins, linked to the consultation', () => {
    renderWidget()

    fireEvent.click(stageButton(/În consultație/))

    expect(screen.getByRole('link', { name: /Carmen Consult/ })).toHaveAttribute('href', '/consultations/c3')
    expect(screen.getByText(/de 25 min/)).toBeInTheDocument()
    const walkIn = screen.getByText('Elena Walkin').closest('li')!
    expect(within(walkIn).getByText('Fără programare')).toBeInTheDocument()
  })

  it('should link to the appointment when the user cannot open consultations', () => {
    mockCanReadConsultations = false
    renderWidget()

    fireEvent.click(stageButton(/În consultație/))

    expect(screen.getByRole('link', { name: /Carmen Consult/ })).toHaveAttribute('href', '/appointments/a3')
  })

  it('should show the amount due and open billing from the to-pay stage', () => {
    renderWidget()

    fireEvent.click(stageButton(/De încasat/))
    fireEvent.click(screen.getByRole('button', { name: 'Încasează' }))

    expect(screen.getByText(/150,00/)).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toHaveTextContent('Încasare c4')
  })

  it('should not offer collection without write access on payments', () => {
    mockCanWritePayments = false
    renderWidget()

    fireEvent.click(stageButton(/De încasat/))

    expect(screen.queryByRole('button', { name: 'Încasează' })).not.toBeInTheDocument()
  })
})
