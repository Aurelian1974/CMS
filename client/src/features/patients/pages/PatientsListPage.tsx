import { useState, useRef, useCallback, useMemo } from 'react'
import {
  type GridComponent,
  ColumnsDirective,
  ColumnDirective,
} from '@syncfusion/ej2-react-grids'
import { AppDataGrid, useGridExport } from '@/components/data-display/AppDataGrid'
import type { PatientDto, PatientStatusFilter } from '../types/patient.types'
import type { PatientFormData } from '../schemas/patient.schema'
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from '../hooks/usePatients'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { useGenders, useBloodTypes, useAllergyTypes, useAllergySeverities } from '@/features/nomenclature/hooks/useNomenclatureLookups'
import { PatientFormModal } from '../components/PatientFormModal/PatientFormModal'
import { PatientDetailModal } from '../components/PatientDetailModal/PatientDetailModal'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge, type BadgeVariant } from '@/components/ui/AppBadge'
import { formatDate } from '@/utils/format'
import styles from './PatientsListPage.module.scss'

// ── Icoane SVG inline ─────────────────────────────────────────────────────────
const IconPlus    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconExcel   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>

const IconSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IconUsers   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const IconAlert   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (first?: string | null, last?: string | null) =>
  `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || '?'

/** Mapare cod severitate → variantă AppBadge */
const getSeverityVariant = (code: string | null): BadgeVariant => {
  if (!code) return 'neutral'
  switch (code.toUpperCase()) {
    case 'ANAPHYLAXIS': return 'critical'
    case 'SEVERE':      return 'danger'
    case 'MODERATE':    return 'warning'
    case 'MILD':        return 'success'
    default:            return 'neutral'
  }
}

/** Text afișat pentru severitate */
const getSeverityLabel = (code: string | null): string => {
  if (!code) return '—'
  switch (code.toUpperCase()) {
    case 'ANAPHYLAXIS': return 'Anafilaxie'
    case 'SEVERE':      return 'Severă'
    case 'MODERATE':    return 'Moderată'
    case 'MILD':        return 'Ușoară'
    default:            return code
  }
}

// ── Configurare grid ──────────────────────────────────────────────────────────
const SORT_SETTINGS = { columns: [{ field: 'fullName' as const, direction: 'Ascending' as const }] }

// ── Componenta principală ─────────────────────────────────────────────────────
export const PatientsListPage = () => {
  const gridRef = useRef<GridComponent>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PatientStatusFilter>('all')
  const [genderFilter, setGenderFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // Modal formular
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPatient, setEditingPatient] = useState<PatientDto | null>(null)

  // Modal detalii pacient (read-only)
  const [detailPatientId, setDetailPatientId] = useState<string | null>(null)

  // Confirmare ștergere
  const [deleteTarget, setDeleteTarget] = useState<PatientDto | null>(null)

  // Mesaje feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Date reale din API
  const { data: patientsResp, isLoading, isError } = usePatients({
    page,
    pageSize,
    search: search || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    sortBy: 'fullName',
    sortDir: 'asc',
  })

  // Date auxiliare pentru modal
  const { data: gendersResp } = useGenders(true)
  const { data: bloodTypesResp } = useBloodTypes(true)
  const { data: allergyTypesResp } = useAllergyTypes(true)
  const { data: allergySeveritiesResp } = useAllergySeverities(true)
  const { data: doctorLookupResp } = useDoctorLookup()

  // Mutații
  const createPatient = useCreatePatient()
  const updatePatient = useUpdatePatient()
  const deletePatient = useDeletePatient()

  const patients = patientsResp?.data?.pagedResult?.items ?? []
  const totalCount = patientsResp?.data?.pagedResult?.totalCount ?? 0
  const stats = patientsResp?.data?.stats
  const genders = gendersResp?.data ?? []
  const bloodTypes = bloodTypesResp?.data ?? []
  const allergyTypes = allergyTypesResp?.data ?? []
  const allergySeverities = allergySeveritiesResp?.data ?? []
  const doctorLookup = doctorLookupResp?.data ?? []

  // Filtrare locală pentru gender (restul se face server-side)
  const filteredData = genderFilter
    ? patients.filter(p => p.genderName === genderFilter)
    : patients

  // Genuri disponibile din datele curente
  const genderNames = useMemo(
    () => [...new Set(patients.map(p => p.genderName).filter(Boolean))].sort() as string[],
    [patients],
  )

  // Funcții helper — mesaje feedback
  const showSuccess = (msg: string) => {
    setErrorMsg(null)
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const showError = (err: unknown) => {
    setSuccessMsg(null)
    const message = err instanceof Error ? err.message : 'A apărut o eroare neașteptată.'
    setErrorMsg(message)
  }

  // ── Modal handlers ─────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingPatient(null)
    setErrorMsg(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (patient: PatientDto) => {
    setEditingPatient(patient)
    setErrorMsg(null)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingPatient(null)
    setErrorMsg(null)
  }

  const handleFormSubmit = (formData: PatientFormData) => {
    const toNull = (v: string | undefined) => v || null

    if (editingPatient) {
      updatePatient.mutate(
        {
          id: editingPatient.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          cnp: formData.cnp,
          birthDate: toNull(formData.birthDate),
          genderId: toNull(formData.genderId),
          bloodTypeId: toNull(formData.bloodTypeId),
          phoneNumber: toNull(formData.phoneNumber),
          secondaryPhone: toNull(formData.secondaryPhone),
          email: toNull(formData.email),
          address: toNull(formData.address),
          city: toNull(formData.city),
          county: toNull(formData.county),
          postalCode: toNull(formData.postalCode),
          insuranceNumber: toNull(formData.insuranceNumber),
          insuranceExpiry: toNull(formData.insuranceExpiry),
          isInsured: formData.isInsured,
          chronicDiseases: toNull(formData.chronicDiseases),
          familyDoctorName: toNull(formData.familyDoctorName),
          notes: toNull(formData.notes),
          isActive: formData.isActive,
          allergies: formData.allergies?.map(a => ({
            allergyTypeId: a.allergyTypeId,
            allergySeverityId: a.allergySeverityId,
            allergenName: a.allergenName,
            notes: toNull(a.notes),
          })),
          doctors: formData.doctors,
          emergencyContacts: formData.emergencyContacts?.map(ec => ({
            fullName: ec.fullName,
            relationship: toNull(ec.relationship),
            phoneNumber: ec.phoneNumber,
            isDefault: ec.isDefault,
          })),
        },
        {
          onSuccess: () => { handleCloseModal(); showSuccess('Pacientul a fost actualizat cu succes.') },
          onError: (err) => showError(err),
        },
      )
    } else {
      createPatient.mutate(
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          cnp: formData.cnp,
          birthDate: toNull(formData.birthDate),
          genderId: toNull(formData.genderId),
          bloodTypeId: toNull(formData.bloodTypeId),
          phoneNumber: toNull(formData.phoneNumber),
          secondaryPhone: toNull(formData.secondaryPhone),
          email: toNull(formData.email),
          address: toNull(formData.address),
          city: toNull(formData.city),
          county: toNull(formData.county),
          postalCode: toNull(formData.postalCode),
          insuranceNumber: toNull(formData.insuranceNumber),
          insuranceExpiry: toNull(formData.insuranceExpiry),
          isInsured: formData.isInsured,
          chronicDiseases: toNull(formData.chronicDiseases),
          familyDoctorName: toNull(formData.familyDoctorName),
          notes: toNull(formData.notes),
          allergies: formData.allergies?.map(a => ({
            allergyTypeId: a.allergyTypeId,
            allergySeverityId: a.allergySeverityId,
            allergenName: a.allergenName,
            notes: toNull(a.notes),
          })),
          doctors: formData.doctors,
          emergencyContacts: formData.emergencyContacts?.map(ec => ({
            fullName: ec.fullName,
            relationship: toNull(ec.relationship),
            phoneNumber: ec.phoneNumber,
            isDefault: ec.isDefault,
          })),
        },
        {
          onSuccess: () => { handleCloseModal(); showSuccess('Pacientul a fost adăugat cu succes.') },
          onError: (err) => showError(err),
        },
      )
    }
  }

  // ── Confirmare ștergere ────────────────────────────────────────────────────
  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deletePatient.mutate(deleteTarget.id, {
      onSuccess: () => { setDeleteTarget(null); showSuccess('Pacientul a fost șters cu succes.') },
      onError: (err) => { setDeleteTarget(null); showError(err) },
    })
  }

  // Date transformate pentru export — plain objects, fără template JSX
  const buildExportData = useCallback(() =>
    filteredData.map(p => ({
      fullName:              p.fullName,
      cnp:                   p.cnp,
      genderName:            p.genderName ?? '—',
      bloodTypeName:         p.bloodTypeName ?? '—',
      phoneNumber:           p.phoneNumber ?? '—',
      email:                 p.email ?? '—',
      allergyCount:          p.allergyCount,
      primaryDoctorName:     p.primaryDoctorName ?? '—',
      isActive:              p.isActive ? 'Activ' : 'Inactiv',
      createdAt:             p.createdAt ? formatDate(p.createdAt) : '—',
    }))
  , [filteredData])

  // ── Export handlers (hook reutilizabil) ─────────────────────────────────────
  const { handleExcelExport, handlePdfExport } = useGridExport(gridRef, {
    fileNamePrefix: 'pacienti',
    buildExportData,
  })

  // ── Cell templates ─────────────────────────────────────────────────────────
  const avatarTemplate = useCallback((row: PatientDto) => (
    <div className={styles.avatar}>{getInitials(row.firstName, row.lastName)}</div>
  ), [])

  const nameTemplate = useCallback((row: PatientDto) => (
    <span className={styles.patientName}>{row.fullName}</span>
  ), [])

  const ageGenderTemplate = useCallback((row: PatientDto) => (
    <span className={styles.patientMeta}>
      {row.age != null ? `${row.age} ani` : ''}
      {row.age != null && row.genderName ? ' · ' : ''}
      {row.genderName ?? ''}
    </span>
  ), [])

  const cnpTemplate = useCallback((row: PatientDto) => (
    <AppBadge variant="primary" mono>{row.cnp}</AppBadge>
  ), [])

  const bloodTypeTemplate = useCallback((row: PatientDto) =>
    row.bloodTypeName
      ? <AppBadge variant="danger">{row.bloodTypeName}</AppBadge>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , [])

  const allergyTemplate = useCallback((row: PatientDto) => {
    if (row.allergyCount === 0) return <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
    const severityText = getSeverityLabel(row.maxAllergySeverityCode)
    return (
      <AppBadge variant={getSeverityVariant(row.maxAllergySeverityCode)}>
        {row.allergyCount} {row.allergyCount === 1 ? 'alergie' : 'alergii'}{severityText ? ` · ${severityText}` : ''}
      </AppBadge>
    )
  }, [])

  const doctorTemplate = useCallback((row: PatientDto) =>
    row.primaryDoctorName
      ? <span style={{ fontSize: '0.85rem' }}>{row.primaryDoctorName}</span>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , [])

  const statusTemplate = useCallback((row: PatientDto) => (
    <AppBadge variant={row.isActive ? 'success' : 'neutral'} withDot>
      {row.isActive ? 'Activ' : 'Inactiv'}
    </AppBadge>
  ), [])

  const actionsTemplate = useCallback((row: PatientDto) => (
    <ActionButtons
      onView={() => setDetailPatientId(row.id)}
      onEdit={() => handleOpenEdit(row)}
      onDelete={() => setDeleteTarget(row)}
    />
  ), [])

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className={styles.page}>
        <div className="alert alert-danger m-4">
          Nu s-au putut încărca datele. Verifică conexiunea la server.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Pacienți</h1>
          <p className={styles.pageSubtitle}>Registru pacienți, alergii și medici asociați</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={handleExcelExport}>
            <IconExcel /> Export Excel
          </button>
          <button className={styles.btnPrimary} onClick={handleOpenCreate}>
            <IconPlus /> Pacient nou
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--blue']}`}><IconUsers /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.totalPatients ?? totalCount}</span>
            <span className={styles.statLabel}>Total pacienți</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--green']}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.activePatients ?? 0}</span>
            <span className={styles.statLabel}>Activi</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--orange']}`}><IconAlert /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.patientsWithAllergies ?? 0}</span>
            <span className={styles.statLabel}>Cu alergii</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--gray']}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.newThisMonth ?? 0}</span>
            <span className={styles.statLabel}>Noi luna aceasta</span>
          </div>
        </div>
      </div>

      {/* Toolbar filtrare */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}><IconSearch /></span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Caută după nume, CNP, telefon, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Gen:</span>
          <select
            className={styles.filterSelect}
            value={genderFilter}
            onChange={e => setGenderFilter(e.target.value)}
          >
            <option value="">Toate</option>
            {genderNames.map(g => (
              <option key={g} value={g}>{g}</option>
            ))}
          </select>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.statusPills}>
          {(['all', 'active', 'inactive'] as PatientStatusFilter[]).map(s => (
            <button
              key={s}
              className={`${styles.pill} ${statusFilter === s ? styles.active : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'Toți' : s === 'active' ? 'Activi' : 'Inactivi'}
            </button>
          ))}
        </div>


      </div>

      {/* Grid */}
      <AppDataGrid
        gridRef={gridRef}
        dataSource={filteredData}
        sortSettings={SORT_SETTINGS}
      >
        <ColumnsDirective>

            <ColumnDirective
              headerText=""
              width="55"
              minWidth="55"
              maxWidth="55"
              template={avatarTemplate}
              allowSorting={false}
              allowFiltering={false}
              allowGrouping={false}
              allowReordering={false}
              allowResizing={false}
              textAlign="Center"
            />

            <ColumnDirective
              field="fullName"
              headerText="Pacient"
              width="190"
              minWidth="150"
              template={nameTemplate}
              allowGrouping={false}
            />

            <ColumnDirective
              field="genderName"
              headerText="Vârstă / Sex"
              width="130"
              minWidth="100"
              template={ageGenderTemplate}
            />

            <ColumnDirective
              field="cnp"
              headerText="CNP"
              width="140"
              minWidth="130"
              template={cnpTemplate}
            />

            <ColumnDirective
              field="bloodTypeName"
              headerText="Grupă sanguină"
              width="130"
              minWidth="110"
              template={bloodTypeTemplate}
            />

            <ColumnDirective
              field="allergyCount"
              headerText="Alergii"
              width="150"
              minWidth="120"
              template={allergyTemplate}
            />

            <ColumnDirective
              field="primaryDoctorName"
              headerText="Medic primar"
              width="160"
              minWidth="130"
              template={doctorTemplate}
            />

            <ColumnDirective
              field="phoneNumber"
              headerText="Telefon"
              width="130"
              minWidth="100"
              defaultValue="—"
              clipMode="EllipsisWithTooltip"
            />

            <ColumnDirective
              field="email"
              headerText="Email"
              width="180"
              minWidth="140"
              defaultValue="—"
              visible={false}
              clipMode="EllipsisWithTooltip"
            />

            <ColumnDirective
              field="isActive"
              headerText="Status"
              width="110"
              minWidth="90"
              template={statusTemplate}
            />

            <ColumnDirective
              field="createdAt"
              headerText="Înregistrat"
              width="120"
              minWidth="100"
              format="dd.MM.yyyy"
              type="date"
              clipMode="EllipsisWithTooltip"
              visible={false}
            />

            <ColumnDirective
              field="id"
              headerText=""
              width="80"
              minWidth="70"
              template={actionsTemplate}
              allowSorting={false}
              allowFiltering={false}
              allowGrouping={false}
              allowReordering={false}
              allowResizing={false}
              allowExporting={false}
              freeze="Right"
            />

          </ColumnsDirective>
      </AppDataGrid>

      {/* Mesaj succes */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show mt-3" role="alert">
          {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg(null)} />
        </div>
      )}

      {/* Modal creare / editare */}
      <PatientFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        isLoading={createPatient.isPending || updatePatient.isPending}
        editData={editingPatient}
        genders={genders}
        bloodTypes={bloodTypes}
        allergyTypes={allergyTypes}
        allergySeverities={allergySeverities}
        doctorLookup={doctorLookup}
        serverError={modalOpen ? errorMsg : null}
      />

      {/* Modal detalii pacient (read-only) */}
      <PatientDetailModal
        isOpen={!!detailPatientId}
        onClose={() => setDetailPatientId(null)}
        patientId={detailPatientId}
        onEdit={() => {
          if (detailPatientId) {
            const patient = patients.find(p => p.id === detailPatientId)
            if (patient) {
              setDetailPatientId(null)
              handleOpenEdit(patient)
            }
          }
        }}
      />

      {/* Dialog confirmare ștergere */}
      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h6 className={styles.confirmTitle}>Confirmare ștergere</h6>
            <p className={styles.confirmText}>
              Sigur dorești să ștergi pacientul <strong>{deleteTarget.fullName}</strong>?
            </p>
            <div className={styles.confirmActions}>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setDeleteTarget(null)}>
                Anulează
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleConfirmDelete}
                disabled={deletePatient.isPending}
              >
                {deletePatient.isPending ? 'Se șterge...' : 'Șterge'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default PatientsListPage
