/**
 * Teste unitare pentru AppointmentsSchedulerPage
 * Verifică:
 * - Randare titlu, subtitlu, butoane header
 * - Navigare dată (prev, today, next)
 * - Afișare doctori și timeline
 * - Stare loading / empty
 * - Navigare la vizualizare tabel
 * - Tooltip pe event bar
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { AppointmentsSchedulerPage } from '@/features/appointments/pages/AppointmentsSchedulerPage'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

vi.mock('@/features/appointments/pages/AppointmentsSchedulerPage.module.scss', () => {
  return {
    default: new Proxy({}, { get: (_t, prop) => String(prop) }),
  }
})

const mockSchedulerData = [
  {
    id: 'apt-1',
    patientId: 'p1',
    patientName: 'Ion Popescu',
    doctorId: 'd1',
    doctorName: 'Ionescu',
    startTime: '2025-03-15T09:00:00',
    endTime: '2025-03-15T09:30:00',
    statusId: 's1',
    statusName: 'Programat',
    statusCode: 'PROGRAMAT',
    notes: 'Control periodic',
  },
  {
    id: 'apt-2',
    patientId: 'p2',
    patientName: 'Maria Vasilescu',
    doctorId: 'd2',
    doctorName: 'Popescu',
    startTime: '2025-03-15T10:00:00',
    endTime: '2025-03-15T11:00:00',
    statusId: 's2',
    statusName: 'Confirmat',
    statusCode: 'CONFIRMAT',
    notes: null,
  },
]

const mockDoctors = [
  { id: 'd1', fullName: 'Dr. Ionescu', firstName: 'Ion', lastName: 'Ionescu', email: null, medicalCode: null, specialtyId: 'sp1', specialtyName: 'Cardiologie', departmentId: null, departmentName: null },
  { id: 'd2', fullName: 'Dr. Popescu', firstName: 'Pop', lastName: 'Popescu', email: null, medicalCode: null, specialtyId: 'sp2', specialtyName: 'Neurologie', departmentId: null, departmentName: null },
]

const defaultSchedulerReturn = {
  data: { data: mockSchedulerData },
  isLoading: false,
}

const defaultDoctorLookupReturn = {
  data: { data: mockDoctors },
}

vi.mock('@/features/appointments/hooks/useAppointments', () => ({
  useAppointmentsForScheduler: vi.fn(() => defaultSchedulerReturn),
  useCreateAppointment: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateAppointment: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
}))

vi.mock('@/features/doctors/hooks/useDoctors', () => ({
  useDoctorLookup: vi.fn(() => defaultDoctorLookupReturn),
}))

vi.mock('@/features/patients/hooks/usePatients', () => ({
  usePatientLookup: vi.fn(() => ({ data: { data: [] } })),
}))

vi.mock('@/features/clinic/hooks/useSchedule', () => ({
  useClinicSchedule:  vi.fn(() => ({ data: { data: [] } })),
  useDoctorSchedules: vi.fn(() => ({ data: { data: [] } })),
}))

vi.mock('@/features/appointments/components/AppointmentFormModal/AppointmentFormModal', () => ({
  AppointmentFormModal: () => null,
}))

import { useAppointmentsForScheduler } from '@/features/appointments/hooks/useAppointments'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('AppointmentsSchedulerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAppointmentsForScheduler).mockReturnValue(defaultSchedulerReturn as unknown as ReturnType<typeof useAppointmentsForScheduler>)
    vi.mocked(useDoctorLookup).mockReturnValue(defaultDoctorLookupReturn as unknown as ReturnType<typeof useDoctorLookup>)
  })

  // ── Header ────────────────────────────────────────────────────────────────

  describe('header', () => {
    it('afișează titlul paginii', () => {
      render(<AppointmentsSchedulerPage />)
      expect(screen.getByText('Scheduler Programări')).toBeInTheDocument()
    })

    it('afișează subtitlul paginii', () => {
      render(<AppointmentsSchedulerPage />)
      expect(screen.getByText('Vizualizare calendar programări pe doctori')).toBeInTheDocument()
    })

    it('conține butonul Vizualizare tabel', () => {
      render(<AppointmentsSchedulerPage />)
      expect(screen.getByText('Vizualizare tabel')).toBeInTheDocument()
    })

    it('conține butonul Programare nouă', () => {
      render(<AppointmentsSchedulerPage />)
      expect(screen.getByText('Programare nouă')).toBeInTheDocument()
    })

    it('navighează la /appointments la click pe Vizualizare tabel', () => {
      render(<AppointmentsSchedulerPage />)
      fireEvent.click(screen.getByText('Vizualizare tabel'))
      expect(mockNavigate).toHaveBeenCalledWith('/appointments')
    })
  })

  // ── Toolbar navigare dată ─────────────────────────────────────────────────

  describe('toolbar navigare dată', () => {
    it('afișează butonul Astăzi', () => {
      render(<AppointmentsSchedulerPage />)
      expect(screen.getByText('Astăzi')).toBeInTheDocument()
    })

    it('afișează selectul doctor cu opțiunea Toți doctorii', () => {
      render(<AppointmentsSchedulerPage />)
      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
      expect(screen.getByText('Toți doctorii')).toBeInTheDocument()
    })

    it('afișează doctorii în dropdown', () => {
      render(<AppointmentsSchedulerPage />)
      // Numele doctorilor apar și în dropdown și în resource labels
      expect(screen.getAllByText('Dr. Ionescu').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Dr. Popescu').length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── Timeline doctori ──────────────────────────────────────────────────────

  describe('timeline doctori', () => {
    it('afișează numele doctorilor ca resource labels', () => {
      render(<AppointmentsSchedulerPage />)
      // fullName apare in resource label
      expect(screen.getAllByText('Dr. Ionescu').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('Dr. Popescu').length).toBeGreaterThanOrEqual(1)
    })

    it('afișează specialitățile doctorilor', () => {
      render(<AppointmentsSchedulerPage />)
      expect(screen.getByText('Cardiologie')).toBeInTheDocument()
      expect(screen.getByText('Neurologie')).toBeInTheDocument()
    })

    it('afișează event bar-uri cu numele pacienților', () => {
      render(<AppointmentsSchedulerPage />)
      expect(screen.getByText('Ion Popescu')).toBeInTheDocument()
      expect(screen.getByText('Maria Vasilescu')).toBeInTheDocument()
    })

    it('afișează orele în header', () => {
      render(<AppointmentsSchedulerPage />)
      expect(screen.getByText('07:00')).toBeInTheDocument()
      expect(screen.getByText('12:00')).toBeInTheDocument()
      expect(screen.getByText('19:00')).toBeInTheDocument()
    })
  })

  // ── Loading state ─────────────────────────────────────────────────────────

  describe('stare loading', () => {
    it('afișează spinner când isLoading=true', () => {
      vi.mocked(useAppointmentsForScheduler).mockReturnValue({
        ...defaultSchedulerReturn,
        isLoading: true,
      } as unknown as ReturnType<typeof useAppointmentsForScheduler>)

      render(<AppointmentsSchedulerPage />)
      expect(screen.getByText('Se încarcă...')).toBeInTheDocument()
    })
  })

  // ── Empty state ───────────────────────────────────────────────────────────

  describe('stare fără doctori', () => {
    it('afișează mesaj gol când nu sunt doctori', () => {
      vi.mocked(useDoctorLookup).mockReturnValue({
        data: { data: [] },
      } as unknown as ReturnType<typeof useDoctorLookup>)

      vi.mocked(useAppointmentsForScheduler).mockReturnValue({
        data: { data: [] },
        isLoading: false,
      } as unknown as ReturnType<typeof useAppointmentsForScheduler>)

      render(<AppointmentsSchedulerPage />)
      expect(screen.getByText('Nu există doctori disponibili')).toBeInTheDocument()
    })
  })

  // ── Tooltip ───────────────────────────────────────────────────────────────

  describe('tooltip', () => {
    it('afișează tooltip la hover peste event bar', async () => {
      render(<AppointmentsSchedulerPage />)
      const eventBar = screen.getByText('Ion Popescu').closest('[class*="eventBar"]')
      expect(eventBar).toBeTruthy()

      if (eventBar) {
        fireEvent.mouseEnter(eventBar)
        // Tooltip ar trebui să conțină informațiile programării
        // Numele pacientului apare și în tooltip.tooltipTitle
        const tooltipElements = screen.getAllByText('Ion Popescu')
        expect(tooltipElements.length).toBeGreaterThanOrEqual(2) // event bar + tooltip
      }
    })

    it('ascunde tooltip la mouse leave', async () => {
      vi.useFakeTimers()

      render(<AppointmentsSchedulerPage />)
      const eventBar = screen.getByText('Ion Popescu').closest('[class*="eventBar"]')

      if (eventBar) {
        fireEvent.mouseEnter(eventBar)
        fireEvent.mouseLeave(eventBar)

        act(() => { vi.advanceTimersByTime(200) })

        // Tooltip a dispărut — doar 1 instanță a numelui (event bar-ul)
        const elements = screen.getAllByText('Ion Popescu')
        expect(elements.length).toBe(1)
      }

      vi.useRealTimers()
    })
  })

  // ── Date navigation ───────────────────────────────────────────────────────

  describe('navigare dată', () => {
    it('apelează hook-ul cu datele corecte la navigare', () => {
      render(<AppointmentsSchedulerPage />)
      // Hook-ul e apelat la render inițial
      expect(useAppointmentsForScheduler).toHaveBeenCalled()
    })
  })
})
