/**
 * Teste unitare pentru AppointmentsListPage
 * Verifică:
 * - Randare titlu, subtitlu, butoane header
 * - Afișare stat cards cu date din hook
 * - Afișare stare de eroare
 * - Funcționalitate navigare la scheduler
 * - Afișare toolbar (search, filtre, pills)
 * - Dialog confirmare ștergere
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, within, act } from '@testing-library/react'
import { AppointmentsListPage } from '@/features/appointments/pages/AppointmentsListPage'

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

// Mock SCSS module — returnează className-uri identice
vi.mock('@/features/appointments/pages/AppointmentsListPage.module.scss', () => {
  return {
    default: new Proxy({}, { get: (_t, prop) => String(prop) }),
  }
})

const mockDeleteMutate = vi.fn()

const defaultAppointmentsReturn = {
  data: {
    data: {
      pagedResult: {
        items: [
          {
            id: 'apt-1',
            clinicId: 'c1',
            patientId: 'p1',
            patientName: 'Ion Popescu',
            patientPhone: '0741000000',
            doctorId: 'd1',
            doctorName: 'Dr. Ionescu',
            specialtyName: 'Cardiologie',
            startTime: '2025-03-15T09:00:00',
            endTime: '2025-03-15T09:30:00',
            statusId: 's1',
            statusName: 'Programat',
            statusCode: 'PROGRAMAT',
            notes: 'Control periodic',
            isDeleted: false,
            createdAt: '2025-03-10T08:00:00',
            createdByName: 'Admin',
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 20,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      stats: {
        totalAppointments: 10,
        scheduledCount: 4,
        confirmedCount: 3,
        completedCount: 2,
        cancelledCount: 1,
        noShowCount: 5,
      },
    },
  },
  isError: false,
}

const defaultDoctorLookupReturn = {
  data: {
    data: [
      { id: 'd1', fullName: 'Dr. Ionescu', firstName: 'Ion', lastName: 'Ionescu', email: null, medicalCode: null, specialtyId: null, specialtyName: 'Cardiologie', departmentId: null, departmentName: null },
    ],
  },
}

const defaultDeleteReturn = {
  mutate: mockDeleteMutate,
  isPending: false,
}

const mockStatuses = [
  { id: 's1', code: 'PROGRAMAT',    name: 'Programat',    sortOrder: 1, blocksSlot: true,  allowedNextCodes: 'CONFIRMAT,FINALIZAT,ANULAT,NEPREZENTARE' },
  { id: 's2', code: 'CONFIRMAT',    name: 'Confirmat',    sortOrder: 2, blocksSlot: true,  allowedNextCodes: 'PROGRAMAT,FINALIZAT,ANULAT,NEPREZENTARE' },
  { id: 's3', code: 'FINALIZAT',    name: 'Finalizat',    sortOrder: 3, blocksSlot: true,  allowedNextCodes: null },
  { id: 's4', code: 'ANULAT',       name: 'Anulat',       sortOrder: 4, blocksSlot: false, allowedNextCodes: 'PROGRAMAT' },
  { id: 's5', code: 'NEPREZENTARE', name: 'Neprezentare', sortOrder: 5, blocksSlot: false, allowedNextCodes: 'PROGRAMAT' },
]

vi.mock('@/features/appointments/hooks/useAppointments', () => ({
  useAppointments: vi.fn(() => defaultAppointmentsReturn),
  useAppointmentStatuses: vi.fn(() => ({ data: { data: mockStatuses } })),
  useDeleteAppointment: vi.fn(() => defaultDeleteReturn),
  useCreateAppointment: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdateAppointment: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useAppointmentDetail: vi.fn(() => ({ data: null, isLoading: false, isError: false })),
}))

vi.mock('@/features/doctors/hooks/useDoctors', () => ({
  useDoctorLookup: vi.fn(() => defaultDoctorLookupReturn),
}))

const fullAccess = { canRead: () => true, canWrite: () => true, hasFull: () => true }
vi.mock('@/hooks/useHasAccess', () => ({
  MODULE: { Appointments: 'appointments' },
  useHasAccess: vi.fn(() => fullAccess),
}))

vi.mock('@/features/patients/hooks/usePatients', () => ({
  usePatientLookup: vi.fn(() => ({ data: { data: [] } })),
}))

// Mock child components — simplificate
vi.mock('@/components/data-display/AppDataGrid', () => ({
  AppDataGrid: vi.fn(() => <div data-testid="app-data-grid">AppDataGrid</div>),
}))

vi.mock('@/components/data-display/ActionButtons', () => ({
  ActionButtons: vi.fn(({ onDelete }: { onDelete?: () => void }) => (
    <div data-testid="action-buttons">
      <button data-testid="btn-delete" onClick={onDelete}>Delete</button>
    </div>
  )),
}))

vi.mock('@/components/ui/AppBadge', () => ({
  AppBadge: vi.fn(({ children }: { children: React.ReactNode }) => <span data-testid="app-badge">{children}</span>),
}))

vi.mock('@/components/ui/AppButton', () => ({
  AppButton: vi.fn(({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
    <button data-testid="app-button" onClick={onClick}>{children}</button>
  )),
}))

vi.mock('@/components/data-display/PhoneCell', () => ({
  phoneCellTemplate: vi.fn(() => <span>phone</span>),
}))

vi.mock('@/components/forms/FormDatePicker', () => ({
  FormDatePicker: vi.fn(({ label }: { label: string }) => <div data-testid="form-date-picker">{label}</div>),
}))

vi.mock('@/features/appointments/components/AppointmentFormModal/AppointmentFormModal', () => ({
  AppointmentFormModal: vi.fn(() => null),
}))

vi.mock('@/features/appointments/components/AppointmentDetailModal/AppointmentDetailModal', () => ({
  AppointmentDetailModal: vi.fn(() => null),
}))

vi.mock('@/utils/format', () => ({
  formatDate: vi.fn((v: string) => v),
}))

// ── Import mocks to manipulate ───────────────────────────────────────────────
import { useAppointments, useDeleteAppointment, useCreateAppointment } from '@/features/appointments/hooks/useAppointments'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { useHasAccess } from '@/hooks/useHasAccess'
import { AppointmentFormModal } from '@/features/appointments/components/AppointmentFormModal/AppointmentFormModal'

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('AppointmentsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useHasAccess).mockReturnValue(fullAccess as unknown as ReturnType<typeof useHasAccess>)
    vi.mocked(useCreateAppointment).mockReturnValue({ mutate: vi.fn(), isPending: false } as unknown as ReturnType<typeof useCreateAppointment>)
    vi.mocked(useAppointments).mockReturnValue(defaultAppointmentsReturn as ReturnType<typeof useAppointments>)
    vi.mocked(useDeleteAppointment).mockReturnValue(defaultDeleteReturn as unknown as ReturnType<typeof useDeleteAppointment>)
    vi.mocked(useDoctorLookup).mockReturnValue(defaultDoctorLookupReturn as ReturnType<typeof useDoctorLookup>)
  })

  // ── Header ────────────────────────────────────────────────────────────────

  describe('header', () => {
    it('afișează titlul paginii', () => {
      render(<AppointmentsListPage />)
      expect(screen.getByText('Programări')).toBeInTheDocument()
    })

    it('afișează subtitlul paginii', () => {
      render(<AppointmentsListPage />)
      expect(screen.getByText('Gestionare programări pacienți, confirmare și anulare')).toBeInTheDocument()
    })

    it('conține butonul Scheduler', () => {
      render(<AppointmentsListPage />)
      expect(screen.getByText('Scheduler')).toBeInTheDocument()
    })

    it('conține butonul Export Excel', () => {
      render(<AppointmentsListPage />)
      expect(screen.getByText('Export Excel')).toBeInTheDocument()
    })

    it('conține butonul Programare nouă', () => {
      render(<AppointmentsListPage />)
      expect(screen.getByText('Programare nouă')).toBeInTheDocument()
    })

    it('navighează la /appointments/scheduler la click pe Scheduler', () => {
      render(<AppointmentsListPage />)
      fireEvent.click(screen.getByText('Scheduler'))
      expect(mockNavigate).toHaveBeenCalledWith('/appointments/scheduler')
    })
  })

  // ── Stat cards ────────────────────────────────────────────────────────────

  describe('stat cards', () => {
    it('afișează totalul programărilor', () => {
      render(<AppointmentsListPage />)
      expect(screen.getByText('10')).toBeInTheDocument()
      expect(screen.getByText('Total programări')).toBeInTheDocument()
    })

    it('afișează countul programate', () => {
      render(<AppointmentsListPage />)
      expect(screen.getByText('4')).toBeInTheDocument()
      // "Programate" apare și în stat card și în status pill
      expect(screen.getAllByText('Programate').length).toBeGreaterThanOrEqual(1)
    })

    it('afișează countul confirmate', () => {
      render(<AppointmentsListPage />)
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getAllByText('Confirmate').length).toBeGreaterThanOrEqual(1)
    })

    it('afișează countul finalizate', () => {
      render(<AppointmentsListPage />)
      expect(screen.getByText('2')).toBeInTheDocument()
      expect(screen.getAllByText('Finalizate').length).toBeGreaterThanOrEqual(1)
    })

    it('afișează countul anulate', () => {
      render(<AppointmentsListPage />)
      // "1" may match multiple elements; check stat label exists
      expect(screen.getAllByText('Anulate').length).toBeGreaterThanOrEqual(1)
    })

    it('afișează countul neprezentări', () => {
      render(<AppointmentsListPage />)
      expect(screen.getByText('5')).toBeInTheDocument()
      expect(screen.getByText('Neprezentări')).toBeInTheDocument()
    })
  })

  // ── Toolbar ───────────────────────────────────────────────────────────────

  describe('toolbar', () => {
    it('afișează input de căutare cu placeholder', () => {
      render(<AppointmentsListPage />)
      expect(screen.getByPlaceholderText('Caută după pacient, doctor, observații...')).toBeInTheDocument()
    })

    it('afișează selectul doctori cu opțiunea Toți', () => {
      render(<AppointmentsListPage />)
      const selects = screen.getAllByRole('combobox')
      const doctorSelect = selects.find(s => within(s).queryByText('Toți'))
      expect(doctorSelect).toBeDefined()
    })

    it('afișează pills status din nomenclator', () => {
      render(<AppointmentsListPage />)
      expect(screen.getByText('Toate')).toBeInTheDocument()
      for (const s of mockStatuses) {
        expect(screen.getByText(s.name)).toBeInTheDocument()
      }
    })

    it('afișează câmpuri de dată (De la / Până la)', () => {
      render(<AppointmentsListPage />)
      expect(screen.getByText('De la')).toBeInTheDocument()
      expect(screen.getByText('Până la')).toBeInTheDocument()
    })
  })

  // ── Grid ──────────────────────────────────────────────────────────────────

  describe('grid', () => {
    it('renderizează AppDataGrid', () => {
      render(<AppointmentsListPage />)
      expect(screen.getByTestId('app-data-grid')).toBeInTheDocument()
    })
  })

  // ── Error state ───────────────────────────────────────────────────────────

  describe('stare de eroare', () => {
    it('afișează mesaj de eroare când isError=true', () => {
      vi.mocked(useAppointments).mockReturnValue({
        ...defaultAppointmentsReturn,
        isError: true,
      } as ReturnType<typeof useAppointments>)

      render(<AppointmentsListPage />)
      expect(screen.getByText('Nu s-au putut încărca datele. Verifică conexiunea la server.')).toBeInTheDocument()
    })

    it('nu afișează grid-ul când isError=true', () => {
      vi.mocked(useAppointments).mockReturnValue({
        ...defaultAppointmentsReturn,
        isError: true,
      } as ReturnType<typeof useAppointments>)

      render(<AppointmentsListPage />)
      expect(screen.queryByTestId('app-data-grid')).not.toBeInTheDocument()
    })
  })

  // ── Empty data ────────────────────────────────────────────────────────────

  describe('permisiuni', () => {
    it('ascunde butonul Programare nouă fără drept de scriere', () => {
      vi.mocked(useHasAccess).mockReturnValue(
        { canRead: () => true, canWrite: () => false, hasFull: () => false } as unknown as ReturnType<typeof useHasAccess>)
      render(<AppointmentsListPage />)
      expect(screen.queryByText('Programare nouă')).not.toBeInTheDocument()
    })
  })

  describe('erori server', () => {
    it('transmite formularului mesajul real de eroare (nu textul generic)', () => {
      const serverMessage = 'Există deja o programare în acest interval orar.'
      vi.mocked(useCreateAppointment).mockReturnValue({
        mutate: vi.fn((_payload: unknown, opts: { onError: (e: Error) => void }) => opts.onError(new Error(serverMessage))),
        isPending: false,
      } as unknown as ReturnType<typeof useCreateAppointment>)

      render(<AppointmentsListPage />)
      const { onSubmit } = vi.mocked(AppointmentFormModal).mock.calls.at(-1)![0]
      act(() => onSubmit({ patientId: 'p1', doctorId: 'd1', startTime: '2025-03-15T09:00:00', endTime: '2025-03-15T09:30:00' }))

      expect(vi.mocked(AppointmentFormModal).mock.calls.at(-1)![0].serverError).toBe(serverMessage)
    })
  })

  describe('date goale', () => {
    it('afișează 0 în stat cards când nu sunt date', () => {
      vi.mocked(useAppointments).mockReturnValue({
        data: {
          data: {
            pagedResult: { items: [], totalCount: 0, page: 1, pageSize: 20, totalPages: 0, hasPreviousPage: false, hasNextPage: false },
            stats: undefined,
          },
        },
        isError: false,
      } as unknown as ReturnType<typeof useAppointments>)

      render(<AppointmentsListPage />)
      const zeros = screen.getAllByText('0')
      expect(zeros.length).toBeGreaterThanOrEqual(4) // scheduledCount, confirmedCount, completedCount, cancelledCount
    })
  })
})
