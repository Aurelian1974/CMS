import { useState, useRef, useCallback, useMemo } from 'react'
import { AppDataGrid } from '@/components/data-display/AppDataGrid'
import type { ColDef, GridApi, PaginationChangedEvent, SortChangedEvent } from '@/components/data-display/AppDataGrid'
import type { PatientDto, PatientStatusFilter } from '../types/patient.types'
import type { PatientFormData } from '../schemas/patient.schema'
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from '../hooks/usePatients'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { useGenders, useBloodTypes, useAllergyTypes, useAllergySeverities } from '@/features/nomenclature/hooks/useNomenclatureLookups'
import { PatientFormModal } from '../components/PatientFormModal/PatientFormModal'
import { PatientDetailModal } from '../components/PatientDetailModal/PatientDetailModal'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge, type BadgeVariant } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { formatDate } from '@/utils/format'
import { phoneCellTemplate } from '@/components/data-display/PhoneCell'
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

// ── Componenta principală ─────────────────────────────────────────────────────
export const PatientsListPage = () => {
  const gridRef = useRef<GridApi<PatientDto>>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PatientStatusFilter>('all')
  const [genderId, setGenderId] = useState<string | undefined>(undefined)
  const [bloodTypeId, setBloodTypeId] = useState<string | undefined>(undefined)
  const [hasAllergies, setHasAllergies] = useState<boolean | undefined>(undefined)

  // Starea grid-ului server-side (pagina, sortare)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState('fullName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

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

  // Date reale din API — paginare + sortare + filtrare complet server-side
  const { data: patientsResp, isError } = usePatients({
    page,
    pageSize,
    search:      search || undefined,
    genderId,
    bloodTypeId,
    hasAllergies,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    sortBy,
    sortDir,
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

  const patients  = patientsResp?.data?.pagedResult?.items ?? []
  const totalCount = patientsResp?.data?.pagedResult?.totalCount ?? 0
  const stats      = patientsResp?.data?.stats

  const genders          = gendersResp?.data ?? []
  const bloodTypes       = bloodTypesResp?.data ?? []
  const allergyTypes     = allergyTypesResp?.data ?? []
  const allergySeverities = allergySeveritiesResp?.data ?? []
  const doctorLookup     = doctorLookupResp?.data ?? []

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
            reaction: toNull(a.reaction),
            onsetDate: toNull(a.onsetDate),
            notes: toNull(a.notes),
          })),
          doctors: formData.doctors,
          emergencyContacts: formData.emergencyContacts?.map(ec => ({
            fullName: ec.fullName,
            relationship: toNull(ec.relationship),
            phoneNumber: ec.phoneNumber ?? '',
            isDefault: ec.isDefault,
            notes: toNull(ec.notes),
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
            reaction: toNull(a.reaction),
            onsetDate: toNull(a.onsetDate),
            notes: toNull(a.notes),
          })),
          doctors: formData.doctors,
          emergencyContacts: formData.emergencyContacts?.map(ec => ({
            fullName: ec.fullName,
            relationship: toNull(ec.relationship),
            phoneNumber: ec.phoneNumber ?? '',
            isDefault: ec.isDefault,
            notes: toNull(ec.notes),
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
    patients.map(p => ({
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
  , [patients])

  // ── Export handler ──────────────────────────────────────────────────────────
  const handleExcelExport = useCallback(() => {
    gridRef.current?.exportExcel({
      fileName: 'pacienti',
      customData: buildExportData(),
    })
  }, [buildExportData])

  // ── Grid server-side callbacks ─────────────────────────────────────────────
  const handlePaginationChanged = useCallback((e: PaginationChangedEvent) => {
    setPage(e.page)
    setPageSize(e.pageSize)
  }, [])

  const handleSortChanged = useCallback((e: SortChangedEvent) => {
    if (e.sort.length > 0) {
      setSortBy(e.sort[0].field)
      setSortDir(e.sort[0].direction)
    } else {
      setSortBy('fullName')
      setSortDir('asc')
    }
    setPage(1)
  }, [])

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

  // ── Column definitions ─────────────────────────────────────────────────────
  const columnDefs = useMemo<ColDef<PatientDto>[]>(() => [
    {
      headerName: '',
      field: 'firstName' as keyof PatientDto & string,
      width: 55, minWidth: 55, maxWidth: 55,
      sortable: false, filterable: false, reorderable: false, resizable: false,
      cellRenderer: ({ data }) => data ? avatarTemplate(data) : null,
    },
    { field: 'fullName', headerName: 'Pacient', width: 190, minWidth: 150, cellRenderer: ({ data }) => data ? nameTemplate(data) : null },
    { field: 'genderName', headerName: 'Vârstă / Sex', width: 130, minWidth: 100, cellRenderer: ({ data }) => data ? ageGenderTemplate(data) : null },
    { field: 'cnp', headerName: 'CNP', width: 140, minWidth: 130, cellRenderer: ({ data }) => data ? cnpTemplate(data) : null },
    { field: 'bloodTypeName', headerName: 'Grupă sanguină', width: 130, minWidth: 110, cellRenderer: ({ data }) => data ? bloodTypeTemplate(data) : null },
    { field: 'allergyCount' as keyof PatientDto & string, headerName: 'Alergii', width: 150, minWidth: 120, cellRenderer: ({ data }) => data ? allergyTemplate(data) : null },
    { field: 'primaryDoctorName', headerName: 'Medic primar', width: 160, minWidth: 130, cellRenderer: ({ data }) => data ? doctorTemplate(data) : null },
    { field: 'phoneNumber', headerName: 'Telefon', width: 160, minWidth: 130, cellRenderer: ({ data }) => phoneCellTemplate(data as unknown as Record<string, unknown>) },
    { field: 'email', headerName: 'Email', width: 180, minWidth: 140, hide: true, ellipsis: true },
    { field: 'isActive' as keyof PatientDto & string, headerName: 'Status', width: 110, minWidth: 90, cellRenderer: ({ data }) => data ? statusTemplate(data) : null },
    { field: 'createdAt', headerName: 'Înregistrat', width: 120, minWidth: 100, hide: true, ellipsis: true, valueFormatter: ({ value }) => value ? formatDate(value as string) : '—' },
    {
      field: 'id', headerName: '', width: 80, minWidth: 70,
      sortable: false, filterable: false, reorderable: false, resizable: false,
      pinned: 'right',
      cellRenderer: ({ data }) => data ? actionsTemplate(data) : null,
    },
  ], [avatarTemplate, nameTemplate, ageGenderTemplate, cnpTemplate, bloodTypeTemplate, allergyTemplate, doctorTemplate, statusTemplate, actionsTemplate])

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
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Gen:</span>
          <select
            className={styles.filterSelect}
            value={genderId ?? ''}
            onChange={e => { setGenderId(e.target.value || undefined); setPage(1) }}
          >
            <option value="">Toate</option>
            {genders.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Grupă sang.:</span>
          <select
            className={styles.filterSelect}
            value={bloodTypeId ?? ''}
            onChange={e => { setBloodTypeId(e.target.value || undefined); setPage(1) }}
          >
            <option value="">Toate</option>
            {bloodTypes.map(bt => (
              <option key={bt.id} value={bt.id}>{bt.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Alergii:</span>
          <select
            className={styles.filterSelect}
            value={hasAllergies === undefined ? '' : hasAllergies ? '1' : '0'}
            onChange={e => {
              const v = e.target.value
              setHasAllergies(v === '' ? undefined : v === '1')
              setPage(1)
            }}
          >
            <option value="">Toate</option>
            <option value="1">Cu alergii</option>
            <option value="0">Fără alergii</option>
          </select>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.statusPills}>
          {(['all', 'active', 'inactive'] as PatientStatusFilter[]).map(s => (
            <button
              key={s}
              className={`${styles.pill} ${statusFilter === s ? styles.active : ''}`}
              onClick={() => { setStatusFilter(s); setPage(1) }}
            >
              {s === 'all' ? 'Toți' : s === 'active' ? 'Activi' : 'Inactivi'}
            </button>
          ))}
        </div>


      </div>

      {/* Grid — mod server-side: paginare + sortare + filtrare la API */}
      <div className={styles.gridWrapper}>
      <AppDataGrid<PatientDto>
        ref={gridRef}
        rowData={patients}
        columnDefs={columnDefs}
        initialSort={[{ field: 'fullName', direction: 'asc' }]}
        loading={!patientsResp}
        getRowId={(row) => row.id}
        // Paginare (server-side)
        pagination
        pageSize={pageSize}
        pageSizes={[10, 20, 50, 100]}
        showPager
        serverSideCount={totalCount}
        onPaginationChanged={handlePaginationChanged}
        onSortChanged={handleSortChanged}
        // Sortare
        triStateSort
        multiSortKey="ctrl"
        // Filtrare
        showFilterRow
        // Selecție
        rowSelection="multiple"
        // Grupare
        showGroupPanel
        groupDefaultExpanded={1}
        // Toolbar & Context Menu
        toolbar
        contextMenu
        // Status Bar
        statusBar={[
          { type: 'totalRows' },
          { type: 'filteredRows' },
          { type: 'selectedRows' },
        ]}
        // Aspect
        alternateRows
        enableHover
        gridLines="horizontal"
        stickyHeader
        // Drag & Drop
        rowDragEnabled
      />
      </div>

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
              <AppButton variant="outline-secondary" size="sm" onClick={() => setDeleteTarget(null)}>
                Anulează
              </AppButton>
              <AppButton
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                isLoading={deletePatient.isPending}
                loadingText="Se șterge..."
              >
                Șterge
              </AppButton>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default PatientsListPage
