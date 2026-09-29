/**
 * DashboardPage — pagina doar mapează ce trimite serverul: ordine, widget-uri
 * necunoscute ignorate, stări de încărcare / eroare / fără widget-uri.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import type { DashboardDto } from '@/features/dashboard/types/dashboard.types'

const mockUseDashboard = vi.fn()
vi.mock('@/features/dashboard/hooks/useDashboard', () => ({
  useDashboard: () => mockUseDashboard(),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: (selector: (s: { user: { fullName: string; role: string }; permissions: unknown[] }) => unknown) =>
    selector({ user: { fullName: 'Ana Pop', role: 'receptionist' }, permissions: [] }),
}))

const ok = (data: DashboardDto) => ({
  data: { success: true, data, message: null, errors: null },
  isLoading: false,
  isError: false,
  refetch: vi.fn(),
})

const renderPage = () => render(<MemoryRouter><DashboardPage /></MemoryRouter>)

const renderedIds = () =>
  Array.from(document.querySelectorAll('[data-widget-id]')).map((e) => e.getAttribute('data-widget-id'))

describe('DashboardPage', () => {
  beforeEach(() => mockUseDashboard.mockReset())

  it('should render widgets in server order with KPIs grouped first', () => {
    mockUseDashboard.mockReturnValue(ok({
      today: '2026-09-27',
      widgetIds: ['list.agenda.today', 'kpi.appointments.today', 'kpi.patients.new.month'],
      clinicalKpis: { appointmentsToday: 5, patientsNewThisMonth: 2 },
      agenda: { appointments: [] },
    }))

    renderPage()

    expect(renderedIds()).toEqual(['kpi.appointments.today', 'kpi.patients.new.month', 'list.agenda.today'])
    expect(screen.getByText('Programări azi')).toBeInTheDocument()
    expect(screen.getByText('Toate programările de azi sunt confirmate.')).toBeInTheDocument()
  })

  it('should ignore unknown widget ids and render the rest', () => {
    mockUseDashboard.mockReturnValue(ok({
      widgetIds: ['widget.from.newer.backend', 'kpi.appointments.today'],
      clinicalKpis: { appointmentsToday: 3 },
    }))

    renderPage()

    expect(renderedIds()).toEqual(['kpi.appointments.today'])
  })

  it('should show an explicit screen when there are no widgets', () => {
    mockUseDashboard.mockReturnValue(ok({ widgetIds: [] }))

    renderPage()

    expect(screen.getByText('Niciun widget disponibil')).toBeInTheDocument()
  })

  it('should show a spinner while loading', () => {
    mockUseDashboard.mockReturnValue({ data: undefined, isLoading: true, isError: false, refetch: vi.fn() })

    renderPage()

    expect(screen.getByRole('status', { name: 'Se încarcă...' })).toBeInTheDocument()
  })

  it('should show an error with a working retry button', () => {
    const refetch = vi.fn()
    mockUseDashboard.mockReturnValue({ data: undefined, isLoading: false, isError: true, refetch })

    renderPage()
    fireEvent.click(screen.getByRole('button', { name: 'Reîncearcă' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Dashboard-ul nu a putut fi încărcat.')
    expect(refetch).toHaveBeenCalledTimes(1)
  })

  it('should not render clinical notes when the server sent null', () => {
    mockUseDashboard.mockReturnValue(ok({
      widgetIds: ['list.agenda.today'],
      agenda: {
        appointments: [{
          id: 'a1', startTime: '2026-09-27T10:00:00', endTime: '2026-09-27T10:30:00',
          patientId: 'p1', patientName: 'Ion Pop', doctorId: 'd1', doctorName: 'Dr. X',
          statusCode: 'PROGRAMAT', statusName: 'Programat', notes: null,
        }],
      },
    }))

    renderPage()

    expect(screen.getByText('Dr. X')).toBeInTheDocument()
    expect(screen.queryByText(/null/)).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ion Pop/ })).toHaveAttribute('href', '/appointments/a1')
  })

  it('should render one freshness card when both ANM and CNAS are allowed', () => {
    mockUseDashboard.mockReturnValue(ok({
      widgetIds: ['panel.freshness.anm', 'panel.freshness.cnas'],
      health: { syncFreshness: [{ source: 'ANM', lastStatus: 'Success' }, { source: 'CNAS', lastStatus: 'Success' }] },
    }))

    renderPage()

    expect(renderedIds()).toEqual(['panel.freshness.anm'])
    expect(screen.getByText('ANM')).toBeInTheDocument()
    expect(screen.getByText('CNAS')).toBeInTheDocument()
  })
})
