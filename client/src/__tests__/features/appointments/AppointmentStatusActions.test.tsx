import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AppointmentStatusActions } from '@/features/appointments/components/AppointmentStatusActions/AppointmentStatusActions'

const mockStatuses = [
  { id: 's1', code: 'PROGRAMAT',    name: 'Programat',    sortOrder: 1, blocksSlot: true,  allowedNextCodes: 'CONFIRMAT,FINALIZAT,ANULAT,NEPREZENTARE' },
  { id: 's2', code: 'CONFIRMAT',    name: 'Confirmat',    sortOrder: 2, blocksSlot: true,  allowedNextCodes: 'PROGRAMAT,FINALIZAT,ANULAT,NEPREZENTARE' },
  { id: 's3', code: 'FINALIZAT',    name: 'Finalizat',    sortOrder: 3, blocksSlot: true,  allowedNextCodes: null },
  { id: 's4', code: 'ANULAT',       name: 'Anulat',       sortOrder: 4, blocksSlot: false, allowedNextCodes: 'PROGRAMAT' },
]

const mockMutate = vi.fn()

vi.mock('@/features/appointments/hooks/useAppointments', () => ({
  useAppointmentStatuses: vi.fn(() => ({ data: { data: mockStatuses } })),
  useUpdateAppointmentStatus: vi.fn(() => ({ mutate: mockMutate, isPending: false })),
}))

const renderActions = (currentStatusCode: string, canWrite = true) => {
  const onSuccess = vi.fn()
  const onError = vi.fn()
  render(
    <AppointmentStatusActions
      appointmentId="apt-1"
      currentStatusCode={currentStatusCode}
      canWrite={canWrite}
      onSuccess={onSuccess}
      onError={onError}
    />,
  )
  return { onSuccess, onError }
}

describe('AppointmentStatusActions', () => {
  beforeEach(() => vi.clearAllMocks())

  it('should show only transitions allowed from the current status', () => {
    renderActions('PROGRAMAT')
    expect(screen.getByText('Confirmă')).toBeInTheDocument()
    expect(screen.getByText('Finalizează')).toBeInTheDocument()
    expect(screen.getByText('Anulează')).toBeInTheDocument()
    expect(screen.queryByText('Reactivează')).not.toBeInTheDocument()
  })

  it('should offer only reactivation when appointment is cancelled', () => {
    renderActions('ANULAT')
    expect(screen.getByText('Reactivează')).toBeInTheDocument()
    expect(screen.queryByText('Confirmă')).not.toBeInTheDocument()
  })

  it('should render nothing for a terminal status', () => {
    const { container } = render(
      <AppointmentStatusActions appointmentId="apt-1" currentStatusCode="FINALIZAT" canWrite onSuccess={vi.fn()} onError={vi.fn()} />,
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('should render nothing without write access', () => {
    renderActions('PROGRAMAT', false)
    expect(screen.queryByText('Confirmă')).not.toBeInTheDocument()
  })

  it('should call PATCH status with the target status id and forward server errors', () => {
    mockMutate.mockImplementation((_payload: unknown, opts: { onError: (e: Error) => void }) =>
      opts.onError(new Error('Tranziția de status nu este permisă.')))
    const { onError } = renderActions('PROGRAMAT')

    fireEvent.click(screen.getByText('Anulează'))

    expect(mockMutate).toHaveBeenCalledWith({ id: 'apt-1', statusId: 's4' }, expect.any(Object))
    expect(onError).toHaveBeenCalledWith('Tranziția de status nu este permisă.')
  })
})
