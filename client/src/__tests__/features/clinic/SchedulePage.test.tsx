/**
 * Teste unitare pentru SchedulePage.
 * Verifică:
 * - Randare titlu, subtitlu, secțiuni principale
 * - Afișare celor 7 zile ale săptămânii cu checkbox-uri
 * - Stare loading → spinner
 * - Secțiunea Program Medici cu carduri
 * - Modal adaugare zi medic
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SchedulePage from '@/features/clinic/pages/SchedulePage'

// ── SCSS mock ─────────────────────────────────────────────────────────────────

vi.mock('@/features/clinic/pages/SchedulePage.module.scss', () => ({
  default: new Proxy({}, { get: (_t, prop) => String(prop) }),
}))

// ── Hook mocks ────────────────────────────────────────────────────────────────

const mockClinicSchedule: import('@/features/clinic/types/schedule.types').ClinicScheduleDto[] = [
  { id: 'cs-1', clinicId: 'clinic-1', dayOfWeek: 1, isOpen: true,  openTime: '08:00', closeTime: '17:00' },
  { id: 'cs-2', clinicId: 'clinic-1', dayOfWeek: 2, isOpen: true,  openTime: '08:00', closeTime: '17:00' },
  { id: 'cs-3', clinicId: 'clinic-1', dayOfWeek: 7, isOpen: false, openTime: null,    closeTime: null    },
]

const mockDoctorSchedule: import('@/features/clinic/types/schedule.types').DoctorScheduleDto[] = [
  {
    id: 'ds-1', clinicId: 'clinic-1', doctorId: 'doc-1',
    doctorName: 'Dr. Ionescu', specialtyName: 'Cardiologie',
    dayOfWeek: 1, startTime: '08:00', endTime: '16:00',
  },
  {
    id: 'ds-2', clinicId: 'clinic-1', doctorId: 'doc-1',
    doctorName: 'Dr. Ionescu', specialtyName: 'Cardiologie',
    dayOfWeek: 3, startTime: '08:00', endTime: '16:00',
  },
  {
    id: 'ds-3', clinicId: 'clinic-1', doctorId: 'doc-2',
    doctorName: 'Dr. Popescu', specialtyName: 'Neurologie',
    dayOfWeek: 2, startTime: '09:00', endTime: '17:00',
  },
]

const mockUpsertClinicDay  = vi.fn()
const mockUpsertDoctorDay  = vi.fn()
const mockDeleteDoctorDay  = vi.fn()

vi.mock('@/features/clinic/hooks/useSchedule', () => ({
  useClinicSchedule: vi.fn(() => ({
    data: { data: mockClinicSchedule },
    isLoading: false,
  })),
  useDoctorSchedules: vi.fn(() => ({
    data: { data: mockDoctorSchedule },
    isLoading: false,
  })),
  useUpsertClinicDay: vi.fn(() => ({
    mutate: mockUpsertClinicDay,
    isPending: false,
  })),
  useUpsertDoctorDay: vi.fn(() => ({
    mutate: mockUpsertDoctorDay,
    isPending: false,
  })),
  useDeleteDoctorDay: vi.fn(() => ({
    mutate: mockDeleteDoctorDay,
    isPending: false,
  })),
}))

vi.mock('@/components/layout/PageHeader', () => ({
  PageHeader: ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div>
      <h1>{title}</h1>
      {subtitle && <p>{subtitle}</p>}
    </div>
  ),
}))

vi.mock('@/components/ui/AppButton', () => ({
  AppButton: ({ children, onClick, isLoading }: { children: React.ReactNode; onClick?: () => void; isLoading?: boolean }) => (
    <button onClick={onClick} disabled={isLoading}>{children}</button>
  ),
}))

vi.mock('@/components/ui/LoadingSpinner', () => ({
  LoadingSpinner: () => <div>Se încarcă...</div>,
}))

import { useClinicSchedule, useDoctorSchedules } from '@/features/clinic/hooks/useSchedule'

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('SchedulePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useClinicSchedule).mockReturnValue({
      data: { data: mockClinicSchedule },
      isLoading: false,
    } as unknown as ReturnType<typeof useClinicSchedule>)

    vi.mocked(useDoctorSchedules).mockReturnValue({
      data: { data: mockDoctorSchedule },
      isLoading: false,
    } as unknown as ReturnType<typeof useDoctorSchedules>)
  })

  // ── Titlu și structură ──────────────────────────────────────────────────────

  describe('structură pagină', () => {
    it('afișează titlul paginii', () => {
      render(<SchedulePage />)
      expect(screen.getByText('Program')).toBeInTheDocument()
    })

    it('afișează subtitlul paginii', () => {
      render(<SchedulePage />)
      expect(screen.getByText('Gestionare program clinică și medici')).toBeInTheDocument()
    })

    it('afișează secțiunea Program Clinică', () => {
      render(<SchedulePage />)
      expect(screen.getByText('Program Clinică')).toBeInTheDocument()
    })

    it('afișează secțiunea Program Medici', () => {
      render(<SchedulePage />)
      expect(screen.getByText('Program Medici')).toBeInTheDocument()
    })
  })

  // ── Program Clinică ─────────────────────────────────────────────────────────

  describe('Program Clinică — 7 zile', () => {
    it('afișează toate cele 7 zile', () => {
      render(<SchedulePage />)
      const days = ['Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă', 'Duminică']
      for (const day of days) {
        expect(screen.getAllByText(day).length).toBeGreaterThan(0)
      }
    })

    it('afișează zilele cu IsOpen=true ca "Deschis"', () => {
      render(<SchedulePage />)
      // Luni și Marți sunt IsOpen=true
      expect(screen.getAllByText('Deschis').length).toBeGreaterThanOrEqual(1)
    })

    it('afișează zilele cu IsOpen=false ca "Închis"', () => {
      render(<SchedulePage />)
      // Duminică (7) e IsOpen=false
      expect(screen.getAllByText('Închis').length).toBeGreaterThanOrEqual(1)
    })

    it('afișează butoanele Salvează pentru fiecare zi', () => {
      render(<SchedulePage />)
      const buttons = screen.getAllByText('Salvează')
      expect(buttons.length).toBe(7)
    })

    it('click Salvează apelează upsertClinicDay.mutate', () => {
      render(<SchedulePage />)
      const saveButtons = screen.getAllByText('Salvează')
      fireEvent.click(saveButtons[0])
      expect(mockUpsertClinicDay).toHaveBeenCalledOnce()
    })
  })

  // ── Program Medici ──────────────────────────────────────────────────────────

  describe('Program Medici — carduri', () => {
    it('afișează cardul pentru Dr. Ionescu', () => {
      render(<SchedulePage />)
      expect(screen.getByText('Dr. Ionescu')).toBeInTheDocument()
    })

    it('afișează cardul pentru Dr. Popescu', () => {
      render(<SchedulePage />)
      expect(screen.getByText('Dr. Popescu')).toBeInTheDocument()
    })

    it('afișează specialitățile medicilor', () => {
      render(<SchedulePage />)
      expect(screen.getByText('Cardiologie')).toBeInTheDocument()
      expect(screen.getByText('Neurologie')).toBeInTheDocument()
    })

    it('afișează zilele configurate cu orele corecte', () => {
      render(<SchedulePage />)
      // Dr. Ionescu are Luni și Miercuri
      expect(screen.getAllByText('Luni').length).toBeGreaterThanOrEqual(1)
      expect(screen.getAllByText('08:00 – 16:00').length).toBeGreaterThanOrEqual(1)
    })
  })

  // ── Stare loading ───────────────────────────────────────────────────────────

  describe('stare loading', () => {
    it('afișează spinner când datele se încarcă', () => {
      vi.mocked(useClinicSchedule).mockReturnValue({
        data: undefined,
        isLoading: true,
      } as unknown as ReturnType<typeof useClinicSchedule>)

      render(<SchedulePage />)
      expect(screen.getByText('Se încarcă...')).toBeInTheDocument()
    })
  })

  // ── Empty state ─────────────────────────────────────────────────────────────

  describe('stare fără medici', () => {
    it('afișează mesaj dacă nu există medici', () => {
      vi.mocked(useDoctorSchedules).mockReturnValue({
        data: { data: [] },
        isLoading: false,
      } as unknown as ReturnType<typeof useDoctorSchedules>)

      render(<SchedulePage />)
      expect(screen.getByText('Niciun medic înregistrat.')).toBeInTheDocument()
    })
  })

  // ── Modal adaugă zi medic ───────────────────────────────────────────────────

  describe('modal adaugă zi medic', () => {
    it('apare modalul la click pe butonul +', () => {
      render(<SchedulePage />)
      // Butoane "+" pentru fiecare card doctor
      const addButtons = screen.getAllByTitle('Adaugă zi')
      fireEvent.click(addButtons[0])
      expect(screen.getByText('Adaugă zi')).toBeInTheDocument()
    })

    it('modalul conține câmpul Zi', () => {
      render(<SchedulePage />)
      const addButtons = screen.getAllByTitle('Adaugă zi')
      fireEvent.click(addButtons[0])
      expect(screen.getByText('Zi')).toBeInTheDocument()
    })

    it('modalul conține câmpurile Oră start și Oră final', () => {
      render(<SchedulePage />)
      const addButtons = screen.getAllByTitle('Adaugă zi')
      fireEvent.click(addButtons[0])
      expect(screen.getByText('Oră start')).toBeInTheDocument()
      expect(screen.getByText('Oră final')).toBeInTheDocument()
    })

    it('Anulează închide modalul', () => {
      render(<SchedulePage />)
      const addButtons = screen.getAllByTitle('Adaugă zi')
      fireEvent.click(addButtons[0])
      fireEvent.click(screen.getByText('Anulează'))
      expect(screen.queryByText('Oră start')).not.toBeInTheDocument()
    })
  })
})
