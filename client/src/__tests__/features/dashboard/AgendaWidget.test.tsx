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
  statusCode: 'PROGRAMAT', statusName: 'Programat', isLate: false,
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

  const actionNames = () => screen.queryAllByRole('button').map(b => b.getAttribute('aria-label'))

  it('should show the allowed transitions as buttons, main action first', () => {
    renderWidget([item()])

    expect(actionNames()).toEqual(['Confirmă Ana Ionescu', 'Anulează Ana Ionescu', 'Neprezentare Ana Ionescu'])
    expect(screen.getByText('Programat')).toBeInTheDocument()
  })

  it('should confirm with a single click', () => {
    renderWidget([item()])

    fireEvent.click(screen.getByRole('button', { name: 'Confirmă Ana Ionescu' }))

    expect(mockMutate).toHaveBeenCalledWith({ id: 'apt-1', statusId: 's2' }, expect.any(Object))
  })

  it('should require a second click to cancel', () => {
    renderWidget([item()])

    fireEvent.click(screen.getByRole('button', { name: 'Anulează Ana Ionescu' }))
    expect(mockMutate).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Sigur? Anulează Ana Ionescu' }))
    expect(mockMutate).toHaveBeenCalledWith({ id: 'apt-1', statusId: 's4' }, expect.any(Object))
  })

  it('should offer withdrawing the confirmation on a confirmed appointment', () => {
    renderWidget([item({ statusCode: 'CONFIRMAT', statusName: 'Confirmat' })])

    expect(actionNames()).toEqual([
      'Retrage confirmarea Ana Ionescu', 'Anulează Ana Ionescu', 'Neprezentare Ana Ionescu',
    ])
  })

  it('should show the server error returned by the status change', () => {
    mockMutate.mockImplementation((_p: unknown, opts: { onError: (e: Error) => void }) =>
      opts.onError(new Error('Tranziția de status nu este permisă.')))
    renderWidget([item()])

    fireEvent.click(screen.getByRole('button', { name: 'Confirmă Ana Ionescu' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Tranziția de status nu este permisă.')
  })

  it('should flag late appointments', () => {
    renderWidget([item({ isLate: true }), item({ id: 'apt-2', patientName: 'Ion Pop', isLate: false })])

    expect(screen.getAllByText('Întârziat')).toHaveLength(1)
  })

  it('should show only the badge for a finalized consultation', () => {
    renderWidget([item({ statusCode: 'FINALIZAT', statusName: 'Consultație finalizată' })])

    expect(actionNames()).toEqual([])
    expect(screen.getByText('Consultație finalizată')).toBeInTheDocument()
  })

  it('should not allow status changes without the right', () => {
    mockCanChange = false
    renderWidget([item()])

    expect(actionNames()).toEqual([])
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
