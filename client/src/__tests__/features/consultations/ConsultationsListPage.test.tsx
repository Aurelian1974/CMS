/**
 * Teste unitare pentru ConsultationsListPage (layout master-detail)
 * Verifică:
 * - Randare titlu, buton header sidebar
 * - Afișare stat-uri compacte
 * - Afișare stare de eroare
 * - Sidebar: search, status chips, card-uri consultații
 * - Detail panel: empty state, tab-uri, action bar
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ConsultationsListPage } from '@/features/consultations/pages/ConsultationsListPage'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/features/consultations/pages/ConsultationsListPage.module.scss', () => {
  return {
    default: new Proxy({}, { get: (_t, prop) => String(prop) }),
  }
})

const mockDeleteMutate = vi.fn()

const defaultConsultationsReturn = {
  data: {
    data: {
      pagedResult: {
        items: [
          {
            id: 'cons-1',
            patientName: 'Ion Popescu',
            doctorName: 'Dr. Maria',
            specialtyName: 'Cardiologie',
            date: '2025-06-15T10:00:00',
            diagnostic: null,
            diagnosticCodes: 'G43.9',
            statusId: 'c2000000-0000-0000-0000-000000000001',
            statusName: 'În lucru',
            statusCode: 'INLUCRU',
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 50,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      stats: {
        totalConsultations: 10,
        draftCount: 4,
        completedCount: 3,
        lockedCount: 3,
      },
    },
  },
  isError: false,
}

const defaultDoctorLookupReturn = {
  data: {
    data: [
      { id: 'd1', fullName: 'Dr. Maria', firstName: 'Maria', lastName: 'Ionescu', email: null, medicalCode: null, specialtyId: null, specialtyName: 'Cardiologie', departmentId: null, departmentName: null },
    ],
  },
}

const defaultDeleteReturn = {
  mutate: mockDeleteMutate,
  mutateAsync: vi.fn(),
  isPending: false,
}

vi.mock('@/features/consultations/hooks/useConsultations', () => ({
  useConsultations: vi.fn(() => defaultConsultationsReturn),
  useDeleteConsultation: vi.fn(() => defaultDeleteReturn),
  useCreateConsultation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useUpdateConsultation: vi.fn(() => ({ mutateAsync: vi.fn(), isPending: false })),
  useConsultationDetail: vi.fn(() => ({ data: null, isLoading: false, isError: false })),
  consultationKeys: {
    all: ['consultations'],
    lists: () => ['consultations', 'list'],
    list: (p: unknown) => ['consultations', 'list', p],
    details: () => ['consultations', 'detail'],
    detail: (id: string) => ['consultations', 'detail', id],
  },
}))

vi.mock('@/features/doctors/hooks/useDoctors', () => ({
  useDoctorLookup: vi.fn(() => defaultDoctorLookupReturn),
}))

vi.mock('@/features/patients/hooks/usePatients', () => ({
  usePatientLookup: vi.fn(() => ({ data: { data: [] } })),
  usePatientDetail: vi.fn(() => ({ data: null, isLoading: false })),
}))

const defaultAppointmentsReturn = {
  data: {
    data: {
      pagedResult: {
        items: [
          {
            id: 'apt-1',
            clinicId: 'clinic-1',
            patientId: 'p-1',
            patientName: 'Ana Ionescu',
            patientPhone: '0712345678',
            doctorId: 'd1',
            doctorName: 'Dr. Maria',
            specialtyName: 'Cardiologie',
            startTime: '2025-06-15T09:00:00',
            endTime: '2025-06-15T09:30:00',
            statusId: 's1',
            statusName: 'Programat',
            statusCode: 'PROGRAMAT',
            notes: null,
            isDeleted: false,
            createdAt: '2025-06-14T12:00:00',
            createdByName: null,
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 100,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      stats: {
        totalAppointments: 5,
        scheduledCount: 2,
        confirmedCount: 2,
        completedCount: 1,
        cancelledCount: 0,
      },
    },
  },
  isError: false,
}

vi.mock('@/features/appointments/hooks/useAppointments', () => ({
  useAppointments: vi.fn(() => defaultAppointmentsReturn),
}))

vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn((selector: (s: { user: { id: string; role: string; doctorId: string | null } }) => unknown) =>
    selector({ user: { id: 'u1', role: 'admin', doctorId: null } })
  ),
}))

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>()
  return {
    ...actual,
    useQueryClient: vi.fn(() => ({ invalidateQueries: vi.fn() })),
  }
})

vi.mock('@/components/ui/AppBadge', () => ({
  AppBadge: vi.fn(({ children }: { children: React.ReactNode }) => <span data-testid="app-badge">{children}</span>),
}))

vi.mock('@/components/ui/AppButton', () => ({
  AppButton: vi.fn(({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) => (
    <button data-testid="app-button" onClick={onClick}>{children}</button>
  )),
}))

vi.mock('@/components/forms/FormInput/FormInput', () => ({
  FormInput: vi.fn(({ label }: { label: string }) => <div data-testid="form-input">{label}</div>),
}))

vi.mock('@/components/forms/FormSelect/FormSelect', () => ({
  FormSelect: vi.fn(({ label }: { label: string }) => <div data-testid="form-select">{label}</div>),
}))

vi.mock('@/components/forms/FormDatePicker/FormDatePicker', () => ({
  FormDatePicker: vi.fn(({ label }: { label: string }) => <div data-testid="form-datepicker">{label}</div>),
}))

vi.mock('@/utils/format', () => ({
  formatDate: vi.fn((v: string) => v),
  formatDateTime: vi.fn((v: string) => v),
}))

// ── Import mocks to manipulate ───────────────────────────────────────────────
import { useConsultations } from '@/features/consultations/hooks/useConsultations'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { useAppointments } from '@/features/appointments/hooks/useAppointments'

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('ConsultationsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useConsultations).mockReturnValue(defaultConsultationsReturn as ReturnType<typeof useConsultations>)
    vi.mocked(useDoctorLookup).mockReturnValue(defaultDoctorLookupReturn as ReturnType<typeof useDoctorLookup>)
    vi.mocked(useAppointments).mockReturnValue(defaultAppointmentsReturn as ReturnType<typeof useAppointments>)
  })

  // ── Sidebar header ────────────────────────────────────────────────────────

  describe('sidebar', () => {
    it('afișează titlul paginii', () => {
      render(<ConsultationsListPage />)
      expect(screen.getByText('Consultații')).toBeInTheDocument()
    })

    it('conține butonul Nouă', () => {
      render(<ConsultationsListPage />)
      expect(screen.getByText(/Nouă/)).toBeInTheDocument()
    })
  })

  // ── Stats ─────────────────────────────────────────────────────────────────

  describe('stat-uri compacte programări', () => {
    it('afișează totalul programărilor', () => {
      render(<ConsultationsListPage />)
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('afișează numărul de programate', () => {
      render(<ConsultationsListPage />)
      expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── Card list ─────────────────────────────────────────────────────────────

  describe('card list programări', () => {
    it('afișează card-uri cu numele pacienților din programări', () => {
      render(<ConsultationsListPage />)
      expect(screen.getByText('Ana Ionescu')).toBeInTheDocument()
    })

    it('afișează doctorul și specialitatea', () => {
      render(<ConsultationsListPage />)
      expect(screen.getByText(/Dr\. Maria · Cardiologie/)).toBeInTheDocument()
    })

    it('afișează badge-ul de status al programării', () => {
      render(<ConsultationsListPage />)
      expect(screen.getAllByText('Programat').length).toBeGreaterThanOrEqual(1)
    })

    it('afișează labelul Programări azi', () => {
      render(<ConsultationsListPage />)
      expect(screen.getByText('Programări azi')).toBeInTheDocument()
    })
  })

  // ── Detail panel (empty state) ────────────────────────────────────────────

  describe('detail panel', () => {
    it('afișează empty state când nu e selectată nicio consultație', () => {
      render(<ConsultationsListPage />)
      expect(screen.getByText('Nicio consultație selectată')).toBeInTheDocument()
    })

    it('afișează mesajul de instrucțiuni', () => {
      render(<ConsultationsListPage />)
      expect(screen.getByText(/Selectați o consultație/)).toBeInTheDocument()
    })
  })

  // ── Error state ───────────────────────────────────────────────────────────

  describe('error state', () => {
    it('afișează mesaj de eroare la eșec programări', () => {
      vi.mocked(useAppointments).mockReturnValue({
        ...defaultAppointmentsReturn,
        isError: true,
      } as ReturnType<typeof useAppointments>)
      render(<ConsultationsListPage />)
      expect(screen.getByText('Eroare la încărcarea programărilor.')).toBeInTheDocument()
    })
  })

  // ── Empty list ────────────────────────────────────────────────────────────

  describe('empty list', () => {
    it('afișează mesaj când nu sunt programări', () => {
      vi.mocked(useAppointments).mockReturnValue({
        data: {
          data: {
            pagedResult: { items: [], totalCount: 0, page: 1, pageSize: 100, totalPages: 0, hasPreviousPage: false, hasNextPage: false },
            stats: { totalAppointments: 0, scheduledCount: 0, confirmedCount: 0, completedCount: 0, cancelledCount: 0 },
          },
        },
        isError: false,
      } as unknown as ReturnType<typeof useAppointments>)
      render(<ConsultationsListPage />)
      expect(screen.getByText('Nicio programare pentru azi.')).toBeInTheDocument()
    })
  })
})
