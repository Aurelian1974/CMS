/**
 * Teste unitare pentru CnasDrugsPage
 * Verifică:
 * - Randarea titlului și a badge-ului cu numărul total
 * - Afișarea stării de loading
 * - Afișarea stării de eroare
 * - Afișarea stării goale (niciun medicament)
 * - Randarea coloanelor noi: Mod prezentare, Concentrație, Regim pres., Producător
 * - Funcționalitatea câmpului de căutare (reset la pagina 1)
 * - Funcționalitatea filtrelor isActive și isCompensated
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CnasDrugsPage from '@/features/cnas/pages/CnasDrugsPage'
import type { CnasDrugDto, CnasPagedResult } from '@/features/cnas/types/cnas.types'

// ── Mocks CSS module ───────────────────────────────────────────────────────────

vi.mock('@/features/cnas/pages/CnasPage.module.scss', () => ({
  default: new Proxy({}, { get: (_t, prop) => String(prop) }),
}))

// ── Mock useCnasDrugs ──────────────────────────────────────────────────────────

const mockUseCnasDrugs = vi.fn()

vi.mock('@/features/cnas/hooks/useCnas', () => ({
  useCnasDrugs: (...args: unknown[]) => mockUseCnasDrugs(...args),
}))

// ── Mock CnasPagination ────────────────────────────────────────────────────────

vi.mock('@/features/cnas/components/CnasPagination', () => ({
  CnasPagination: ({ page, totalPages }: { page: number; totalPages: number; totalCount: number; onPrev: () => void; onNext: () => void }) => (
    <div data-testid="pagination">
      pagina {page} din {totalPages}
    </div>
  ),
}))

// ── Date de test ───────────────────────────────────────────────────────────────

const makeDrug = (overrides: Partial<CnasDrugDto> = {}): CnasDrugDto => ({
  code: 'TST001',
  name: 'AMOXICILINA 500MG COMPRIMATE',
  activeSubstanceCode: 'ACT001',
  pharmaceuticalForm: 'COMPRIMATE',
  presentationMode: 'CUTIE X 2 BLIST. X 10 COMPR.',
  concentration: '500 MG',
  prescriptionMode: 'P-RF',
  atcCode: 'J01CA04',
  pricePerPackage: 15.5,
  isNarcotic: false,
  isBrand: false,
  isActive: true,
  isCompensated: false,
  company: 'Antibiotice SA',
  anmAuthorizationCode: null,
  anmCommercialName: null,
  anmCountry: null,
  anmDispenseMode: null,
  isInAnm: false,
  copaymentLists: null,
  ...overrides,
})

const makePagedResult = (items: CnasDrugDto[], total = items.length): CnasPagedResult<CnasDrugDto> => ({
  items,
  totalCount: total,
  page: 1,
  pageSize: 20,
  totalPages: Math.ceil(total / 20),
  hasPreviousPage: false,
  hasNextPage: total > 20,
})

// ── Helpers ────────────────────────────────────────────────────────────────────

const withData = (items: CnasDrugDto[], total?: number) =>
  mockUseCnasDrugs.mockReturnValue({
    data: { data: makePagedResult(items, total) },
    isLoading: false,
    isError: false,
  })

const withLoading = () =>
  mockUseCnasDrugs.mockReturnValue({ data: undefined, isLoading: true, isError: false })

const withError = () =>
  mockUseCnasDrugs.mockReturnValue({ data: undefined, isLoading: false, isError: true })

// ── Teste ──────────────────────────────────────────────────────────────────────

describe('CnasDrugsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Titlu și badge ───────────────────────────────────────────────────────────

  describe('header', () => {
    it('afișează titlul „Medicamente CNAS"', () => {
      withData([makeDrug()])
      render(<CnasDrugsPage />)
      expect(screen.getByRole('heading', { name: /medicamente cnas/i })).toBeInTheDocument()
    })

    it('afișează badge-ul cu numărul total de medicamente', () => {
      withData([makeDrug()], 7)
      render(<CnasDrugsPage />)
      // badge conține totalCount.toLocaleString()
      expect(screen.getByText('7')).toBeInTheDocument()
    })
  })

  // ── Stare loading ────────────────────────────────────────────────────────────

  describe('loading', () => {
    it('afișează spinner-ul în timp ce se încarcă datele', () => {
      withLoading()
      render(<CnasDrugsPage />)
      expect(document.querySelector('.spinner-border')).toBeInTheDocument()
    })

    it('nu afișează tabelul în timpul loading', () => {
      withLoading()
      render(<CnasDrugsPage />)
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  // ── Stare eroare ─────────────────────────────────────────────────────────────

  describe('eroare', () => {
    it('afișează mesajul de eroare', () => {
      withError()
      render(<CnasDrugsPage />)
      expect(screen.getByText(/eroare la încărcarea medicamentelor/i)).toBeInTheDocument()
    })

    it('nu afișează tabelul la eroare', () => {
      withError()
      render(<CnasDrugsPage />)
      expect(screen.queryByRole('table')).not.toBeInTheDocument()
    })
  })

  // ── Stare goală ──────────────────────────────────────────────────────────────

  describe('stare goală', () => {
    it('afișează mesaj când nu există medicamente', () => {
      withData([])
      render(<CnasDrugsPage />)
      expect(screen.getByText('Niciun medicament găsit.')).toBeInTheDocument()
    })
  })

  // ── Coloane tabel ────────────────────────────────────────────────────────────

  describe('coloane tabel', () => {
    it('afișează toate header-ele de coloane', () => {
      withData([makeDrug()])
      render(<CnasDrugsPage />)
      expect(screen.getByText('Cod')).toBeInTheDocument()
      expect(screen.getByText('Denumire')).toBeInTheDocument()
      expect(screen.getByText(/substanță activă/i)).toBeInTheDocument()
      expect(screen.getByText(/formă farm/i)).toBeInTheDocument()
      expect(screen.getByText(/mod prezentare/i)).toBeInTheDocument()
      expect(screen.getByText(/regim pres/i)).toBeInTheDocument()
      expect(screen.getByText(/concentrație/i)).toBeInTheDocument()
      expect(screen.getByText('ATC')).toBeInTheDocument()
      expect(screen.getByText(/preț/i)).toBeInTheDocument()
      expect(screen.getByText('Stare')).toBeInTheDocument()
      expect(screen.getByText(/producător/i)).toBeInTheDocument()
    })

    it('afișează datele medicamentului în rând', () => {
      withData([makeDrug()])
      render(<CnasDrugsPage />)
      expect(screen.getByText('TST001')).toBeInTheDocument()
      expect(screen.getByText('AMOXICILINA 500MG COMPRIMATE')).toBeInTheDocument()
      expect(screen.getByText('ACT001')).toBeInTheDocument()
      expect(screen.getByText('COMPRIMATE')).toBeInTheDocument()
      expect(screen.getByText('CUTIE X 2 BLIST. X 10 COMPR.')).toBeInTheDocument()
      expect(screen.getByText('P-RF')).toBeInTheDocument()
      expect(screen.getByText('500 MG')).toBeInTheDocument()
      expect(screen.getByText('J01CA04')).toBeInTheDocument()
      expect(screen.getByText('15.50')).toBeInTheDocument()
      expect(screen.getByText('Antibiotice SA')).toBeInTheDocument()
    })

    it('afișează „Activ" pentru medicament activ', () => {
      withData([makeDrug({ isActive: true })])
      render(<CnasDrugsPage />)
      expect(screen.getByText('Activ')).toBeInTheDocument()
    })

    it('afișează „Inactiv" pentru medicament inactiv', () => {
      withData([makeDrug({ isActive: false })])
      render(<CnasDrugsPage />)
      expect(screen.getByText('Inactiv')).toBeInTheDocument()
    })

    it('afișează badge „Compensat" pentru medicamente compensate', () => {
      withData([makeDrug({ isCompensated: true })])
      render(<CnasDrugsPage />)
      expect(screen.getByText('Compensat')).toBeInTheDocument()
    })

    it('afișează „—" pentru câmpuri null', () => {
      withData([makeDrug({
        presentationMode: null,
        concentration: null,
        prescriptionMode: null,
        company: null,
        activeSubstanceCode: null,
        atcCode: null,
        pricePerPackage: null,
      })])
      render(<CnasDrugsPage />)
      const dashes = screen.getAllByText('—')
      expect(dashes.length).toBeGreaterThanOrEqual(5)
    })
  })

  // ── Câmpul de căutare ────────────────────────────────────────────────────────

  describe('căutare', () => {
    it('câmpul de căutare este vizibil', () => {
      withData([])
      render(<CnasDrugsPage />)
      expect(screen.getByPlaceholderText(/caută/i)).toBeInTheDocument()
    })

    it('hook-ul este apelat cu search-ul introdus', () => {
      withData([])
      render(<CnasDrugsPage />)
      const input = screen.getByPlaceholderText(/caută/i)
      fireEvent.change(input, { target: { value: 'amoxicilina' } })
      expect(mockUseCnasDrugs).toHaveBeenLastCalledWith(
        expect.objectContaining({ search: 'amoxicilina', page: 1 })
      )
    })

    it('hook-ul primește undefined când câmpul e gol', () => {
      withData([])
      render(<CnasDrugsPage />)
      // La randare inițială search e '' → undefined
      expect(mockUseCnasDrugs).toHaveBeenCalledWith(
        expect.objectContaining({ search: undefined })
      )
    })
  })

  // ── Filtre ───────────────────────────────────────────────────────────────────

  describe('filtre', () => {
    it('hook-ul este apelat cu isActive=true implicit', () => {
      withData([])
      render(<CnasDrugsPage />)
      expect(mockUseCnasDrugs).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: true })
      )
    })

    it('filtrul de compensate este undefined implicit', () => {
      withData([])
      render(<CnasDrugsPage />)
      expect(mockUseCnasDrugs).toHaveBeenCalledWith(
        expect.objectContaining({ isCompensated: undefined })
      )
    })

    it('schimbarea filtrului isActive trimite noua valoare la hook', () => {
      withData([])
      render(<CnasDrugsPage />)
      const selects = screen.getAllByRole('combobox')
      fireEvent.change(selects[0], { target: { value: '' } })
      expect(mockUseCnasDrugs).toHaveBeenLastCalledWith(
        expect.objectContaining({ isActive: undefined })
      )
    })

    it('selectarea „Compensate" actualizează filtrul isCompensated', () => {
      withData([])
      render(<CnasDrugsPage />)
      const selects = screen.getAllByRole('combobox')
      fireEvent.change(selects[1], { target: { value: 'true' } })
      expect(mockUseCnasDrugs).toHaveBeenLastCalledWith(
        expect.objectContaining({ isCompensated: true })
      )
    })
  })

  // ── Paginare ─────────────────────────────────────────────────────────────────

  describe('paginare', () => {
    it('afișează componenta de paginare', () => {
      withData([makeDrug()], 100)
      render(<CnasDrugsPage />)
      expect(screen.getByTestId('pagination')).toBeInTheDocument()
    })
  })
})
