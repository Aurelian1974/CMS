/**
 * Teste unitare pentru PatientsListPage
 * Verifică:
 * - Randare titlu / subtitlu / stat cards
 * - REGRESIE: editarea trimite formularului datele COMPLETE ale pacientului
 *   (pacient + alergii + medici + contacte), nu rândul din listă — altfel
 *   salvarea ar dezactiva sub-colecțiile în baza de date
 * - Formularul e blocat cât timp detaliile se încarcă
 * - Permisiuni: fără drept de scriere, acțiunile de modificare nu apar
 * - Erorile din afara formularului (ex. ștergere eșuată) sunt afișate
 * - Stat cards aplică filtrele corespunzătoare
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PatientsListPage } from '@/features/patients/pages/PatientsListPage'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/features/patients/pages/PatientsListPage.module.scss', () => ({
  default: new Proxy({}, { get: (_t, prop) => String(prop) }),
}))

// PageHeader folosește useNavigate — pagina nu e randată într-un Router în teste
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}))

const patientRow = {
  id: 'pat-1',
  clinicId: 'c1',
  patientCode: 'PACIENT001',
  firstName: 'Ion',
  lastName: 'Popescu',
  fullName: 'Ion Popescu',
  cnp: '1900101123457',
  birthDate: '1990-01-01',
  age: 36,
  genderId: 'g1',
  genderName: 'Masculin',
  bloodTypeId: 'b1',
  bloodTypeName: '0+',
  phoneNumber: '+40721234567',
  email: 'ion@test.ro',
  address: null,
  insuranceNumber: 'AS1',
  insuranceExpiry: '2027-01-01',
  allergyCount: 2,
  maxAllergySeverityCode: 'SEVERE',
  primaryDoctorName: 'Dr. Ionescu',
  isActive: true,
  createdAt: '2026-01-05T10:00:00',
}

const patientsReturn = {
  data: {
    data: {
      pagedResult: {
        items: [patientRow],
        totalCount: 1, page: 1, pageSize: 20, totalPages: 1,
        hasPreviousPage: false, hasNextPage: false,
      },
      stats: {
        totalPatients: 42,
        activePatients: 40,
        patientsWithAllergies: 7,
        newThisMonth: 3,
      },
    },
  },
  isError: false,
  isFetching: false,
}

/** Detaliul complet — exact ce NU conține DTO-ul de listă. */
const patientDetail = {
  patient: {
    ...patientRow,
    secondaryPhone: '+40722345678',
    city: 'Cluj-Napoca',
    county: 'Cluj',
    postalCode: '400000',
    isInsured: true,
    chronicDiseases: 'Diabet tip II',
    familyDoctorName: 'Dr. Familie',
    notes: 'Note importante',
    totalVisits: 4,
    createdBy: 'u1',
    createdByName: 'Admin',
    updatedAt: null,
    updatedBy: null,
    updatedByName: null,
  },
  allergies: [
    {
      id: 'al-1', allergyTypeId: 't1', allergyTypeName: 'Medicament', allergyTypeCode: 'DRUG',
      allergySeverityId: 's1', allergySeverityName: 'Severă', allergySeverityCode: 'SEVERE',
      allergenName: 'Penicilină', reaction: 'Urticarie', onsetDate: '2020-05-01',
      notes: null, isActive: true, createdAt: '2026-01-05T10:00:00',
    },
  ],
  doctors: [
    {
      id: 'pd-1', doctorId: 'd1', doctorName: 'Dr. Ionescu', doctorEmail: null, doctorPhone: null,
      doctorMedicalCode: null, doctorSpecialtyName: 'Cardiologie', isPrimary: true,
      assignedAt: '2026-01-05T10:00:00', notes: null, isActive: true,
    },
  ],
  emergencyContacts: [
    {
      id: 'ec-1', fullName: 'Maria Popescu', relationship: 'Soție',
      phoneNumber: '+40733456789', isDefault: true, notes: null, isActive: true,
    },
  ],
}

const mockDeleteMutate = vi.fn()
const deleteReturn = { mutate: mockDeleteMutate, isPending: false }

vi.mock('@/features/patients/hooks/usePatients', () => ({
  usePatients: vi.fn(() => patientsReturn),
  usePatientDetail: vi.fn(() => ({ data: { data: patientDetail }, isError: false })),
  useCreatePatient: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useUpdatePatient: vi.fn(() => ({ mutate: vi.fn(), isPending: false })),
  useDeletePatient: vi.fn(() => deleteReturn),
}))

vi.mock('@/features/doctors/hooks/useDoctors', () => ({
  useDoctorLookup: vi.fn(() => ({ data: { data: [{ id: 'd1', fullName: 'Dr. Ionescu', specialtyName: 'Cardiologie' }] } })),
}))

vi.mock('@/features/nomenclature/hooks/useNomenclatureLookups', () => ({
  useGenders: vi.fn(() => ({ data: { data: [{ id: 'g1', name: 'Masculin', code: 'M', isActive: true }] } })),
  useBloodTypes: vi.fn(() => ({ data: { data: [{ id: 'b1', name: '0+', code: '0+', isActive: true }] } })),
  useAllergyTypes: vi.fn(() => ({ data: { data: [] } })),
  useAllergySeverities: vi.fn(() => ({ data: { data: [] } })),
}))

const mockCanWrite = vi.fn(() => true)
vi.mock('@/hooks/useHasAccess', () => ({
  MODULE: { Patients: 'patients' },
  useHasAccess: () => ({ canWrite: mockCanWrite }),
}))

// Grid-ul e mock-uit, dar expunem randările de celule ca să putem acționa butoanele
type GridProps = {
  rowData?: typeof patientRow[]
  columnDefs: { field?: string; cellRenderer?: (p: { data: typeof patientRow }) => unknown }[]
}
vi.mock('@/components/data-display/AppDataGrid', () => ({
  AppDataGrid: vi.fn(({ rowData, columnDefs }: GridProps) => (
    <div data-testid="app-data-grid">
      {rowData?.map(row => (
        <div key={row.id}>
          {columnDefs.map((col, i) => (
            <span key={i}>{col.cellRenderer ? (col.cellRenderer({ data: row }) as React.ReactNode) : null}</span>
          ))}
        </div>
      ))}
    </div>
  )),
}))

vi.mock('@/components/data-display/ActionButtons', () => ({
  ActionButtons: vi.fn(({ onEdit, onDelete }: { onEdit?: () => void; onDelete?: () => void }) => (
    <div data-testid="action-buttons">
      {onEdit && <button data-testid="btn-edit" onClick={onEdit}>Edit</button>}
      {onDelete && <button data-testid="btn-delete" onClick={onDelete}>Delete</button>}
    </div>
  )),
}))

vi.mock('@/components/data-display/PhoneCell', () => ({
  phoneCellTemplate: vi.fn(() => <span>phone</span>),
}))

// Capturăm props-urile formularului: aici se vede dacă primește datele complete
const formModalProps: Record<string, unknown>[] = []
vi.mock('@/features/patients/components/PatientFormModal/PatientFormModal', () => ({
  PatientFormModal: vi.fn((props: Record<string, unknown>) => {
    formModalProps.push(props)
    return props.isOpen ? <div data-testid="patient-form-modal" /> : null
  }),
}))

vi.mock('@/features/patients/components/PatientDetailModal/PatientDetailModal', () => ({
  PatientDetailModal: vi.fn(() => null),
}))

// ── Import mocks to manipulate ───────────────────────────────────────────────
import { usePatients, usePatientDetail } from '@/features/patients/hooks/usePatients'

const lastFormProps = () => formModalProps[formModalProps.length - 1]

// ── Test Suite ────────────────────────────────────────────────────────────────

describe('PatientsListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    formModalProps.length = 0
    mockCanWrite.mockReturnValue(true)
    vi.mocked(usePatients).mockReturnValue(patientsReturn as ReturnType<typeof usePatients>)
    vi.mocked(usePatientDetail).mockReturnValue(
      { data: { data: patientDetail }, isError: false } as unknown as ReturnType<typeof usePatientDetail>,
    )
  })

  // ── Header & stats ────────────────────────────────────────────────────────

  it('afișează titlul și subtitlul paginii', () => {
    render(<PatientsListPage />)
    expect(screen.getByText('Pacienți')).toBeInTheDocument()
    expect(screen.getByText('Registru pacienți, alergii și medici asociați')).toBeInTheDocument()
  })

  it('afișează statisticile din API', () => {
    render(<PatientsListPage />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  // ── Regresie: editarea pornește de la datele complete ─────────────────────

  describe('editare pacient', () => {
    it('trimite formularului datele complete (alergii, medici, contacte)', () => {
      render(<PatientsListPage />)

      fireEvent.click(screen.getByTestId('btn-edit'))

      const props = lastFormProps()
      expect(props.isOpen).toBe(true)
      expect(props.editData).toEqual(patientDetail)
      // sub-colecțiile chiar ajung la formular — altfel salvarea le-ar șterge
      expect((props.editData as typeof patientDetail).allergies).toHaveLength(1)
      expect((props.editData as typeof patientDetail).doctors).toHaveLength(1)
      expect((props.editData as typeof patientDetail).emergencyContacts).toHaveLength(1)
      expect(props.isLoadingData).toBe(false)
    })

    it('blochează formularul cât timp detaliile se încarcă', () => {
      vi.mocked(usePatientDetail).mockReturnValue(
        { data: undefined, isError: false } as unknown as ReturnType<typeof usePatientDetail>,
      )
      render(<PatientsListPage />)

      fireEvent.click(screen.getByTestId('btn-edit'))

      const props = lastFormProps()
      expect(props.isLoadingData).toBe(true)
      expect(props.editData).toBeNull()
    })

    it('închide formularul și semnalează eroarea dacă detaliile nu pot fi încărcate', () => {
      vi.mocked(usePatientDetail).mockReturnValue(
        { data: undefined, isError: true } as unknown as ReturnType<typeof usePatientDetail>,
      )
      render(<PatientsListPage />)

      fireEvent.click(screen.getByTestId('btn-edit'))

      expect(screen.queryByTestId('patient-form-modal')).not.toBeInTheDocument()
      expect(screen.getByText(/Nu s-au putut încărca datele pacientului/)).toBeInTheDocument()
    })
  })

  // ── Permisiuni ────────────────────────────────────────────────────────────

  describe('permisiuni', () => {
    it('afișează acțiunile de modificare pentru utilizatorii cu drept de scriere', () => {
      render(<PatientsListPage />)
      expect(screen.getByText('Pacient nou')).toBeInTheDocument()
      expect(screen.getByTestId('btn-edit')).toBeInTheDocument()
      expect(screen.getByTestId('btn-delete')).toBeInTheDocument()
    })

    it('ascunde adăugarea / editarea / ștergerea fără drept de scriere', () => {
      mockCanWrite.mockReturnValue(false)
      render(<PatientsListPage />)

      expect(screen.queryByText('Pacient nou')).not.toBeInTheDocument()
      expect(screen.queryByTestId('btn-edit')).not.toBeInTheDocument()
      expect(screen.queryByTestId('btn-delete')).not.toBeInTheDocument()
      // exportul rămâne disponibil — e o operație de citire
      expect(screen.getByText('Export Excel')).toBeInTheDocument()
    })
  })

  // ── Filtre din stat cards ─────────────────────────────────────────────────

  describe('stat cards ca filtre', () => {
    it('filtrează pacienții activi la click pe cardul "Activi"', () => {
      render(<PatientsListPage />)

      fireEvent.click(screen.getByTitle('Filtrează doar pacienții activi'))

      expect(vi.mocked(usePatients).mock.calls.at(-1)?.[0]).toMatchObject({ isActive: true })
    })

    it('filtrează pacienții cu alergii la click pe cardul "Cu alergii"', () => {
      render(<PatientsListPage />)

      fireEvent.click(screen.getByTitle('Filtrează pacienții cu alergii înregistrate'))

      expect(vi.mocked(usePatients).mock.calls.at(-1)?.[0]).toMatchObject({ hasAllergies: true })
    })
  })

  // ── Eroare de încărcare ───────────────────────────────────────────────────

  it('afișează mesaj de eroare dacă lista nu poate fi încărcată', () => {
    vi.mocked(usePatients).mockReturnValue(
      { data: undefined, isError: true, isFetching: false } as unknown as ReturnType<typeof usePatients>,
    )
    render(<PatientsListPage />)
    expect(screen.getByText(/Nu s-au putut încărca datele/)).toBeInTheDocument()
  })
})
