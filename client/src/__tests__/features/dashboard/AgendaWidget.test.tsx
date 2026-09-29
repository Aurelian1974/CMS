import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { AgendaWidget } from '@/features/dashboard/components/widgets/AgendaWidget'
import type { DashboardDto, DashboardAgendaItemDto } from '@/features/dashboard/types/dashboard.types'

const mockStatuses = [
  { id: 's1', code: 'PROGRAMAT',    name: 'Programat',              sortOrder: 1, blocksSlot: true,  allowedNextCodes: 'CONFIRMAT,ANULAT,NEPREZENTARE' },
  { id: 's2', code: 'CONFIRMAT',    name: 'Confirmat',              sortOrder: 2, blocksSlot: true,  allowedNextCodes: 'PROGRAMAT,ANULAT,NEPREZENTARE' },
  { id: 's3', code: 'FINALIZAT',    name: 'Consultație finalizată', sortOrder: 3, blocksSlot: true,  allowedNextCodes: null },
  { id: 's4', code: 'ANULAT',       name: 'Anulat',                 sortOrder: 4, blocksSlot: false, allowedNextCodes: 'PROGRAMAT' },
  { id: 's5', code: 'NEPREZENTARE', name: 'Neprezentare',           sortOrder: 5, blocksSlot: false, allowedNextCodes: 'PROGRAMAT' },
]

const mockMutate = vi.fn()
let mockCanChange = true

vi.mock('@/features/appointments/hooks/useAppointments', () => ({
  useAppointmentStatuses: vi.fn(() => ({ data: { data: mockStatuses } })),
  useUpdateAppointmentStatus: vi.fn(() => ({ mutate: mockMutate, isPending: false })),
}))

vi.mock('@/features/appointments/hooks/useCanChangeAppointmentStatus', () => ({
  useCanChangeAppointmentStatus: vi.fn(() => mockCanChange),
}))

const item = (overrides: Partial<DashboardAgendaItemDto> = {}): DashboardAgendaItemDto => ({
  id: 'apt-1', startTime: '2026-09-29T09:00:00', endTime: '2026-09-29T09:30:00',
  patientId: 'p1', patientName: 'Ana Ionescu', doctorId: 'd1', doctorName: 'Dr. Maria',
  statusCode: 'PROGRAMAT', statusName: 'Programat', consultationId: null,
  ...overrides,
})

const renderWidget = (items: DashboardAgendaItemDto[]) =>
  render(
    <MemoryRouter>
      <AgendaWidget data={{ agenda: { appointments: items } } as DashboardDto} />
    </MemoryRouter>,
  )

describe('AgendaWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCanChange = true
  })

  it('should offer only the transitions allowed from the current status', () => {
    renderWidget([item()])

    const select = screen.getByRole('combobox', { name: 'Stare programare Ana Ionescu' })
    const options = Array.from(select.querySelectorAll('option')).map(o => o.textContent)
    expect(options).toEqual(['Programat', 'Confirmat', 'Anulat', 'Neprezentare'])
  })

  it('should send the target status id when the status is changed', () => {
    renderWidget([item()])

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'CONFIRMAT' } })

    expect(mockMutate).toHaveBeenCalledWith({ id: 'apt-1', statusId: 's2' }, expect.any(Object))
  })

  it('should show the server error returned by the status change', () => {
    mockMutate.mockImplementation((_p: unknown, opts: { onError: (e: Error) => void }) =>
      opts.onError(new Error('Tranziția de status nu este permisă.')))
    renderWidget([item()])

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'ANULAT' } })

    expect(screen.getByRole('alert')).toHaveTextContent('Tranziția de status nu este permisă.')
  })

  it('should show a read-only badge once the consultation has started', () => {
    renderWidget([item({ statusCode: 'CONFIRMAT', statusName: 'Confirmat', consultationId: 'c1' })])

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByText('Confirmat')).toBeInTheDocument()
  })

  it('should show a read-only badge for a finalized consultation', () => {
    renderWidget([item({ statusCode: 'FINALIZAT', statusName: 'Consultație finalizată' })])

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByText('Consultație finalizată')).toBeInTheDocument()
  })

  it('should not allow status changes without the right', () => {
    mockCanChange = false
    renderWidget([item()])

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('should group appointments by doctor, sorted by doctor name, keeping time order', () => {
    renderWidget([
      item({ id: 'a1', doctorId: 'd2', doctorName: 'Popa Ion',     patientName: 'Pacient 1', startTime: '2026-09-29T08:00:00' }),
      item({ id: 'a2', doctorId: 'd1', doctorName: 'Albu Maria',   patientName: 'Pacient 2', startTime: '2026-09-29T09:00:00' }),
      item({ id: 'a3', doctorId: 'd2', doctorName: 'Popa Ion',     patientName: 'Pacient 3', startTime: '2026-09-29T10:00:00' }),
    ])

    const groups = screen.getAllByRole('region').filter(r => r.getAttribute('aria-label')?.startsWith('Programări '))
    expect(groups.map(g => g.getAttribute('aria-label'))).toEqual(['Programări Albu Maria', 'Programări Popa Ion'])
    const popa = within(groups[1])
    expect(popa.getAllByText(/^Pacient \d$/).map(e => e.textContent)).toEqual(['Pacient 1', 'Pacient 3'])
    expect(popa.getByText('2')).toBeInTheDocument()
  })
})
