import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AttentionWidget } from '@/features/dashboard/components/widgets/AttentionWidget'
import type { DashboardAttentionItemDto, DashboardDto } from '@/features/dashboard/types/dashboard.types'

vi.mock('@/hooks/useHasAccess', () => ({
  MODULE: { Consultations: 'consultations' },
  useHasAccess: () => ({ canRead: () => true }),
}))

vi.mock('@/features/appointments/hooks/useCanChangeAppointmentStatus', () => ({
  useCanChangeAppointmentStatus: () => true,
}))

vi.mock('@/features/appointments/hooks/useAppointments', () => ({
  useAppointmentStatuses: () => ({ data: { data: [
    { id: 's1', code: 'PROGRAMAT', name: 'Programat', sortOrder: 1, blocksSlot: true, allowedNextCodes: 'CONFIRMAT,ANULAT,NEPREZENTARE' },
    { id: 's2', code: 'CONFIRMAT', name: 'Confirmat', sortOrder: 2, blocksSlot: true, allowedNextCodes: 'PROGRAMAT,ANULAT,NEPREZENTARE' },
    { id: 's4', code: 'ANULAT', name: 'Anulat', sortOrder: 4, blocksSlot: false, allowedNextCodes: 'PROGRAMAT' },
    { id: 's5', code: 'NEPREZENTARE', name: 'Neprezentare', sortOrder: 5, blocksSlot: false, allowedNextCodes: 'PROGRAMAT' },
  ] } }),
  useUpdateAppointmentStatus: () => ({ mutate: vi.fn(), isPending: false }),
}))

const ITEMS: DashboardAttentionItemDto[] = [
  { type: 'STALE_CONSULTATION', appointmentId: 'a1', consultationId: 'c1', occurredAt: '2026-09-27T00:00:00',
    patientId: 'p1', patientName: 'Ana Deschisa', doctorId: 'd', doctorName: 'Dr. Pop',
    statusCode: 'INLUCRU', statusName: 'In lucru', daysOpen: 2 },
  { type: 'UNRESOLVED_APPOINTMENT', appointmentId: 'a2', consultationId: null, occurredAt: '2026-09-28T10:00:00',
    patientId: 'p2', patientName: 'Bogdan Uitat', doctorId: 'd', doctorName: 'Dr. Pop',
    statusCode: 'CONFIRMAT', statusName: 'Confirmat', daysOpen: 1 },
  { type: 'LATE_APPOINTMENT', appointmentId: 'a3', consultationId: null, occurredAt: '2026-09-29T09:00:00',
    patientId: 'p3', patientName: 'Carmen Intarziata', doctorId: 'd', doctorName: 'Dr. Pop',
    statusCode: 'PROGRAMAT', statusName: 'Programat', daysOpen: 0 },
]

const rowOf = (patient: string) => screen.getByText(patient).closest('li')!

describe('AttentionWidget', () => {
  it('should label each situation and offer the right follow-up', () => {
    render(
      <MemoryRouter>
        <AttentionWidget data={{ flow: { attention: ITEMS } } as DashboardDto} />
      </MemoryRouter>,
    )

    const stale = within(rowOf('Ana Deschisa'))
    expect(stale.getByText('Consultație nefinalizată')).toBeInTheDocument()
    expect(stale.getByText(/deschisă de 2 zile/)).toBeInTheDocument()
    expect(stale.getByRole('link')).toHaveAttribute('href', '/consultations/c1')
    expect(stale.queryByRole('button')).not.toBeInTheDocument()

    const unresolved = within(rowOf('Bogdan Uitat'))
    expect(unresolved.getByText('Programare nerezolvată')).toBeInTheDocument()
    expect(unresolved.getByRole('button', { name: 'Neprezentare Bogdan Uitat' })).toBeInTheDocument()

    const late = within(rowOf('Carmen Intarziata'))
    expect(late.getByText('Întârziat')).toBeInTheDocument()
    expect(late.getByRole('button', { name: 'Confirmă Carmen Intarziata' })).toBeInTheDocument()
  })
})
