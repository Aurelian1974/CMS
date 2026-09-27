import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AppDataGrid } from '@/components/data-display/AppDataGrid'
import type { ColDef, GridApi, PaginationChangedEvent, SortChangedEvent } from '@/components/data-display/AppDataGrid'
import type { PatientDto, PatientStatusFilter, GetPatientsParams } from '../types/patient.types'
import type { PatientFormData } from '../schemas/patient.schema'
import { usePatients, usePatientDetail, useCreatePatient, useUpdatePatient, useDeletePatient } from '../hooks/usePatients'
import { buildPatientPayload } from '../utils/patientPayload'
import { patientsApi } from '@/api/endpoints/patients.api'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { useGenders, useBloodTypes, useAllergyTypes, useAllergySeverities } from '@/features/nomenclature/hooks/useNomenclatureLookups'
import { PatientFormModal } from '../components/PatientFormModal/PatientFormModal'
import { PatientDetailModal } from '../components/PatientDetailModal/PatientDetailModal'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge, ActiveBadge, type BadgeVariant } from '@/components/ui/AppBadge'
import { IconPlus, IconExcel } from '@/components/ui/Icons'
import { formatDate, getInitials } from '@/utils/format'
import { useDebounce } from '@/hooks/useDebounce'
import { useFeedback } from '@/hooks/useFeedback'
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { FeedbackAlerts } from '@/components/ui/FeedbackAlerts'
import { ListPageToolbar } from '@/components/ui/ListPageToolbar'
import { phoneCellTemplate } from '@/components/data-display/PhoneCell'
import styles from './PatientsListPage.module.scss'

// \u2500\u2500 Icoane specifice paginii (comune importate din @/components/ui/Icons) \u2500\u2500\u2500\u2500\u2500\u2500
const IconUsers   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const IconAlert   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

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

/** Zile rămase până la expirarea asigurării (negativ = deja expirată). */
const daysUntil = (isoDate: string): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(isoDate)
  target.setHours(0, 0, 0, 0)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** Prag sub care asigurarea e semnalizată ca "expiră curând". */
const INSURANCE_WARNING_DAYS = 30

/** Numărul maxim de pacienți descărcați pentru exportul Excel. */
const EXPORT_MAX_ROWS = 5000

// ── Componenta principală ─────────────────────────────────────────────────────
export const PatientsListPage = () => {
  const gridRef = useRef<GridApi<PatientDto>>(null)

  // Permisiuni — backend-ul impune [HasAccess], UI-ul doar reflectă nivelul
  const { canWrite } = useHasAccess()
  const canModify = canWrite(MODULE.Patients)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PatientStatusFilter>('all')
  const [genderId, setGenderId] = useState<string | undefined>(undefined)
  const [bloodTypeId, setBloodTypeId] = useState<string | undefined>(undefined)
  const [hasAllergies, setHasAllergies] = useState<boolean | undefined>(undefined)
  const [doctorId, setDoctorId] = useState<string | undefined>(undefined)

  // Căutarea e trimisă la server doar după o pauză de tastare (evită un request/tastă)
  const debouncedSearch = useDebounce(search, 350)

  // Starea grid-ului server-side (pagina, sortare)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState('fullName')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // Modal formular — ținem doar id-ul; datele complete se încarcă din API
  const [modalOpen, setModalOpen] = useState(false)
  const [editingPatientId, setEditingPatientId] = useState<string | null>(null)

  // Modal detalii pacient (read-only)
  const [detailPatientId, setDetailPatientId] = useState<string | null>(null)

  // Confirmare ștergere
  const [deleteTarget, setDeleteTarget] = useState<PatientDto | null>(null)

  // Export Excel (descarcă toate rândurile filtrate, nu doar pagina curentă)
  const [isExporting, setIsExporting] = useState(false)

  // Mesaje feedback
  const { successMsg, errorMsg, showSuccess, showError, setSuccessMsg, setErrorMsg } = useFeedback()

  // Parametrii de filtrare — reutilizați și la export ca să exporte exact ce se vede
  const queryParams = useMemo<GetPatientsParams>(() => ({
    page,
    pageSize,
    search:      debouncedSearch || undefined,
    genderId,
    bloodTypeId,
    doctorId,
    hasAllergies,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    sortBy,
    sortDir,
  }), [page, pageSize, debouncedSearch, genderId, bloodTypeId, doctorId, hasAllergies, statusFilter, sortBy, sortDir])

  // Date reale din API — paginare + sortare + filtrare complet server-side
  const { data: patientsResp, isError, isFetching } = usePatients(queryParams)

  // Datele complete ale pacientului editat (pacient + alergii + medici + contacte).
  // Obligatoriu: salvarea sincronizează sub-colecțiile, deci formularul nu poate
  // porni de la DTO-ul de listă, care nu le conține.
  const { data: editDetailResp, isError: isEditDetailError } =
    usePatientDetail(editingPatientId ?? '', !!editingPatientId)

  const editDetail = editingPatientId ? editDetailResp?.data ?? null : null
  const isLoadingEditDetail = !!editingPatientId && !editDetail && !isEditDetailError

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

  const patients  = useMemo(() => patientsResp?.data?.pagedResult?.items ?? [], [patientsResp])
  const totalCount = patientsResp?.data?.pagedResult?.totalCount ?? 0
  const stats      = patientsResp?.data?.stats

  const genders          = gendersResp?.data ?? []
  const bloodTypes       = bloodTypesResp?.data ?? []
  const allergyTypes     = allergyTypesResp?.data ?? []
  const allergySeverities = allergySeveritiesResp?.data ?? []
  const doctorLookup     = doctorLookupResp?.data ?? []

  // Dacă detaliile nu pot fi încărcate, nu lăsăm deschis un formular incomplet:
  // salvarea lui ar suprascrie datele existente cu valori goale.
  useEffect(() => {
    if (editingPatientId && isEditDetailError) {
      setModalOpen(false)
      setEditingPatientId(null)
      showError(new Error('Nu s-au putut încărca datele pacientului. Încearcă din nou.'))
    }
  }, [editingPatientId, isEditDetailError, showError])

  // ── Modal handlers ─────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingPatientId(null)
    setErrorMsg(null)
    setModalOpen(true)
  }

  const handleOpenEdit = useCallback((patientId: string) => {
    setEditingPatientId(patientId)
    setErrorMsg(null)
    setModalOpen(true)
  }, [setErrorMsg])

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingPatientId(null)
    setErrorMsg(null)
  }

  const handleFormSubmit = (formData: PatientFormData) => {
    const payload = buildPatientPayload(formData)

    if (editingPatientId) {
      updatePatient.mutate(
        { ...payload, id: editingPatientId, isActive: formData.isActive },
        {
          onSuccess: () => { handleCloseModal(); showSuccess('Pacientul a fost actualizat cu succes.') },
          onError: (err) => showError(err),
        },
      )
    } else {
      createPatient.mutate(payload, {
        onSuccess: () => { handleCloseModal(); showSuccess('Pacientul a fost adăugat cu succes.') },
        onError: (err) => showError(err),
      })
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
  const buildExportData = useCallback((rows: PatientDto[]) =>
    rows.map(p => ({
      fullName:              p.fullName,
      cnp:                   p.cnp,
      age:                   p.age ?? '—',
      genderName:            p.genderName ?? '—',
      bloodTypeName:         p.bloodTypeName ?? '—',
      phoneNumber:           p.phoneNumber ?? '—',
      email:                 p.email ?? '—',
      allergyCount:          p.allergyCount,
      maxAllergySeverity:    getSeverityLabel(p.maxAllergySeverityCode),
      primaryDoctorName:     p.primaryDoctorName ?? '—',
      insuranceNumber:       p.insuranceNumber ?? '—',
      insuranceExpiry:       p.insuranceExpiry ? formatDate(p.insuranceExpiry) : '—',
      isActive:              p.isActive ? 'Activ' : 'Inactiv',
      createdAt:             p.createdAt ? formatDate(p.createdAt) : '—',
    }))
  , [])

  // ── Export handler ──────────────────────────────────────────────────────────
  // Exportă TOATE rândurile care respectă filtrele curente, nu doar pagina afișată.
  const handleExcelExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const resp = await patientsApi.getAll({
        ...queryParams,
        page: 1,
        pageSize: EXPORT_MAX_ROWS,
      })
      const rows = resp?.data?.pagedResult?.items ?? []

      gridRef.current?.exportExcel({
        fileName: 'pacienti',
        customData: buildExportData(rows),
      })

      if (totalCount > EXPORT_MAX_ROWS) {
        showSuccess(`Export limitat la primii ${EXPORT_MAX_ROWS} pacienți din ${totalCount}. Restrânge filtrele pentru un export complet.`)
      }
    } catch (err) {
      showError(err)
    } finally {
      setIsExporting(false)
    }
  }, [queryParams, buildExportData, totalCount, showSuccess, showError])

  // ── Grid server-side callbacks ─────────────────────────────────────────────
  const handlePaginationChanged = useCallback((e: PaginationChangedEvent) => {
    setPage(e.page)
    setPageSize(e.pageSize)
  }, [])

  const handleSortChanged = useCallback((e: SortChangedEvent) => {
    if (e.sort.length > 0) {
      setSortBy(e.sort[0].field)
      setSortDir(e.sort[0].direction ?? 'asc')
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

  const ageGenderTemplate = useCallback((row: PatientDto) => {
    if (row.age == null && !row.genderName) return <span className={styles.muted}>—</span>
    return (
      <span className={styles.patientMeta}>
        {row.age != null ? `${row.age} ani` : ''}
        {row.age != null && row.genderName ? ' · ' : ''}
        {row.genderName ?? ''}
      </span>
    )
  }, [])

  const cnpTemplate = useCallback((row: PatientDto) => (
    <AppBadge variant="primary" mono>{row.cnp}</AppBadge>
  ), [])

  const bloodTypeTemplate = useCallback((row: PatientDto) =>
    row.bloodTypeName
      ? <AppBadge variant="danger">{row.bloodTypeName}</AppBadge>
      : <span className={styles.muted}>—</span>
  , [])

  const allergyTemplate = useCallback((row: PatientDto) => {
    if (row.allergyCount === 0) return <span className={styles.muted}>—</span>
    const severityText = getSeverityLabel(row.maxAllergySeverityCode)
    return (
      <AppBadge variant={getSeverityVariant(row.maxAllergySeverityCode)}>
        {row.allergyCount} {row.allergyCount === 1 ? 'alergie' : 'alergii'}{severityText ? ` · ${severityText}` : ''}
      </AppBadge>
    )
  }, [])

  const doctorTemplate = useCallback((row: PatientDto) =>
    row.primaryDoctorName
      ? <span className={styles.cellText}>{row.primaryDoctorName}</span>
      : <span className={styles.muted}>—</span>
  , [])

  /// Asigurare CNAS: numărul sau semnalizarea expirării (relevant la programări / facturare)
  const insuranceTemplate = useCallback((row: PatientDto) => {
    if (!row.insuranceExpiry) {
      return row.insuranceNumber
        ? <AppBadge variant="neutral" mono>{row.insuranceNumber}</AppBadge>
        : <span className={styles.muted}>—</span>
    }

    const days = daysUntil(row.insuranceExpiry)
    if (days < 0)  return <AppBadge variant="danger">Expirată {formatDate(row.insuranceExpiry)}</AppBadge>
    if (days <= INSURANCE_WARNING_DAYS)
      return <AppBadge variant="warning">Expiră {days === 0 ? 'azi' : `în ${days} zile`}</AppBadge>

    return <AppBadge variant="success">Validă {formatDate(row.insuranceExpiry)}</AppBadge>
  }, [])

  const statusTemplate = useCallback((row: PatientDto) => <ActiveBadge isActive={row.isActive} />, [])

  // Editarea / ștergerea sunt ascunse pentru utilizatorii cu drept doar de citire
  const actionsTemplate = useCallback((row: PatientDto) => (
    <ActionButtons
      onView={() => setDetailPatientId(row.id)}
      onEdit={canModify ? () => handleOpenEdit(row.id) : undefined}
      onDelete={canModify ? () => setDeleteTarget(row) : undefined}
    />
  ), [handleOpenEdit, canModify])

  // ── Column definitions ─────────────────────────────────────────────────────
  const columnDefs = useMemo<ColDef<PatientDto>[]>(() => [
    {
      headerName: '',
      field: 'firstName' as keyof PatientDto & string,
      width: 55, minWidth: 55, maxWidth: 55,
      sortable: false, filterable: false, reorderable: false, resizable: false,
      cellRenderer: ({ data }) => data ? avatarTemplate(data) : null,
    },
    { field: 'fullName', headerName: 'Pacient', flex: 2, minWidth: 150, cellRenderer: ({ data }) => data ? nameTemplate(data) : null },
    // Sortarea se face pe `age` (mapat pe BirthDate în SP) — nu pe genderName, cum era înainte
    { field: 'age' as keyof PatientDto & string, headerName: 'Vârstă / Sex', width: 130, minWidth: 100, cellRenderer: ({ data }) => data ? ageGenderTemplate(data) : null },
    { field: 'cnp', headerName: 'CNP', width: 140, minWidth: 130, cellRenderer: ({ data }) => data ? cnpTemplate(data) : null },
    { field: 'bloodTypeName', headerName: 'Grupă sanguină', width: 130, minWidth: 110, cellRenderer: ({ data }) => data ? bloodTypeTemplate(data) : null },
    { field: 'allergyCount' as keyof PatientDto & string, headerName: 'Alergii', width: 150, minWidth: 120, cellRenderer: ({ data }) => data ? allergyTemplate(data) : null },
    { field: 'primaryDoctorName', headerName: 'Medic primar', flex: 1, minWidth: 130, cellRenderer: ({ data }) => data ? doctorTemplate(data) : null },
    { field: 'phoneNumber', headerName: 'Telefon', width: 160, minWidth: 130, cellRenderer: ({ data }) => phoneCellTemplate(data as unknown as Record<string, unknown>) },
    { field: 'insuranceExpiry', headerName: 'Asigurare', width: 165, minWidth: 140, cellRenderer: ({ data }) => data ? insuranceTemplate(data) : null },
    { field: 'email', headerName: 'Email', width: 180, minWidth: 140, hide: true, ellipsis: true },
    { field: 'isActive' as keyof PatientDto & string, headerName: 'Status', width: 110, minWidth: 90, cellRenderer: ({ data }) => data ? statusTemplate(data) : null },
    { field: 'createdAt', headerName: 'Înregistrat', width: 120, minWidth: 100, hide: true, ellipsis: true, valueFormatter: ({ value }) => value ? formatDate(value as string) : '—' },
    {
      field: 'id', headerName: '', width: 160, minWidth: 160,
      sortable: false, filterable: false, reorderable: false, resizable: false,
      pinned: 'right',
      cellRenderer: ({ data }) => data ? actionsTemplate(data) : null,
    },
  ], [avatarTemplate, nameTemplate, ageGenderTemplate, cnpTemplate, bloodTypeTemplate, allergyTemplate, doctorTemplate, insuranceTemplate, statusTemplate, actionsTemplate])

  // Filtrarea pe coloană a grid-ului e client-side, deci ar filtra doar pagina încărcată
  // (20 din N rânduri) — filtrele reale sunt cele din toolbar, trimise la server.
  const defaultColDef = useMemo<Partial<ColDef<PatientDto>>>(() => ({ filterable: false }), [])

  // Toolbar-ul implicit ar adăuga o căutare + exporturi care lucrează doar pe pagina
  // curentă; păstrăm strict selectorul de coloane.
  const gridToolbar = useMemo(() => [
    { id: 'column-chooser', type: 'column-chooser' as const, align: 'right' as const },
  ], [])

  const hasActiveFilters =
    !!search || statusFilter !== 'all' || !!genderId || !!bloodTypeId || !!doctorId || hasAllergies !== undefined

  const handleResetFilters = useCallback(() => {
    setSearch('')
    setStatusFilter('all')
    setGenderId(undefined)
    setBloodTypeId(undefined)
    setDoctorId(undefined)
    setHasAllergies(undefined)
    setPage(1)
  }, [])

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

      <PageHeader
        title="Pacienți"
        subtitle="Registru pacienți, alergii și medici asociați"
        actions={
          <>
            <button
              className={styles.btnSecondary}
              onClick={handleExcelExport}
              disabled={isExporting || totalCount === 0}
              title={`Exportă toți cei ${totalCount} pacienți care respectă filtrele curente`}
            >
              <IconExcel /> {isExporting ? 'Se exportă...' : 'Export Excel'}
            </button>
            {canModify && (
              <button className={styles.btnPrimary} onClick={handleOpenCreate}>
                <IconPlus /> Pacient nou
              </button>
            )}
          </>
        }
      />

      {/* Stats — primele trei carduri aplică filtrul corespunzător pe listă */}
      <div className={styles.statsBar}>
        <button
          type="button"
          className={`${styles.statCard} ${!hasActiveFilters ? styles.statCardActive : ''}`}
          onClick={handleResetFilters}
          aria-pressed={!hasActiveFilters}
          title="Arată toți pacienții (șterge filtrele)"
        >
          <div className={`${styles.statIcon} ${styles['statIcon--blue']}`}><IconUsers /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.totalPatients ?? totalCount}</span>
            <span className={styles.statLabel}>Total pacienți</span>
          </div>
        </button>

        <button
          type="button"
          className={`${styles.statCard} ${statusFilter === 'active' ? styles.statCardActive : ''}`}
          onClick={() => { setStatusFilter(statusFilter === 'active' ? 'all' : 'active'); setPage(1) }}
          aria-pressed={statusFilter === 'active'}
          title="Filtrează doar pacienții activi"
        >
          <div className={`${styles.statIcon} ${styles['statIcon--green']}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.activePatients ?? 0}</span>
            <span className={styles.statLabel}>Activi</span>
          </div>
        </button>

        <button
          type="button"
          className={`${styles.statCard} ${hasAllergies === true ? styles.statCardActive : ''}`}
          onClick={() => { setHasAllergies(hasAllergies === true ? undefined : true); setPage(1) }}
          aria-pressed={hasAllergies === true}
          title="Filtrează pacienții cu alergii înregistrate"
        >
          <div className={`${styles.statIcon} ${styles['statIcon--orange']}`}><IconAlert /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.patientsWithAllergies ?? 0}</span>
            <span className={styles.statLabel}>Cu alergii</span>
          </div>
        </button>

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
      <ListPageToolbar
        search={search}
        onSearchChange={v => { setSearch(v); setPage(1) }}
        searchPlaceholder="Caută după nume, CNP, telefon, email..."
        statusFilter={statusFilter}
        onStatusChange={s => { setStatusFilter(s); setPage(1) }}
        statusOptions={[
          { value: 'all' as PatientStatusFilter, label: 'Toți' },
          { value: 'active' as PatientStatusFilter, label: 'Activi' },
          { value: 'inactive' as PatientStatusFilter, label: 'Inactivi' },
        ]}
        filters={
          <>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="filter-gender">Gen:</label>
              <select
                id="filter-gender"
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
              <label className={styles.filterLabel} htmlFor="filter-blood-type">Grupă sang.:</label>
              <select
                id="filter-blood-type"
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
              <label className={styles.filterLabel} htmlFor="filter-allergies">Alergii:</label>
              <select
                id="filter-allergies"
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

            {/* Filtru pe medic — suportat de SP (@DoctorId), dar nefolosit înainte în UI */}
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel} htmlFor="filter-doctor">Medic:</label>
              <select
                id="filter-doctor"
                className={styles.filterSelect}
                value={doctorId ?? ''}
                onChange={e => { setDoctorId(e.target.value || undefined); setPage(1) }}
              >
                <option value="">Toți</option>
                {doctorLookup.map(d => (
                  <option key={d.id} value={d.id}>{d.fullName}</option>
                ))}
              </select>
            </div>

            {hasActiveFilters && (
              <button type="button" className={styles.resetFiltersBtn} onClick={handleResetFilters}>
                Șterge filtrele
              </button>
            )}
          </>
        }
      />

      {/* Grid — mod server-side: paginare + sortare + filtrare la API */}
      <div className={styles.gridWrapper}>
      <AppDataGrid<PatientDto>
        ref={gridRef}
        rowData={patients}
        columnDefs={columnDefs}
        initialSort={[{ field: 'fullName', direction: 'asc' }]}
        // isFetching, nu !patientsResp: cu keepPreviousData datele vechi rămân afișate,
        // deci altfel schimbarea de pagină / filtru nu ar arăta niciun indicator
        loading={isFetching}
        getRowId={(row) => row.id}
        defaultColDef={defaultColDef}
        onRowDoubleClick={({ data }) => data && setDetailPatientId(data.id)}
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
        // Selecție
        rowSelection="multiple"
        // Toolbar & Context Menu — fără grupare / reordonare prin drag: ambele ar opera
        // doar pe pagina încărcată, iar ordinea din grid nu e persistată nicăieri
        toolbar={gridToolbar}
        contextMenu
        // Status Bar — 'filtered-count' ar repeta totalul în mod server-side
        statusBar={[
          { type: 'total-count' },
          { type: 'selected-count' },
        ]}
        // Aspect
        alternateRows
        enableHover
        gridLines="horizontal"
        stickyHeader
      />
      </div>

      {/* Erorile din afara formularului (ex. ștergere eșuată) erau invizibile — acum apar aici */}
      <FeedbackAlerts
        successMsg={successMsg}
        errorMsg={modalOpen ? null : errorMsg}
        onDismissSuccess={() => setSuccessMsg(null)}
        onDismissError={() => setErrorMsg(null)}
      />

      {/* Modal creare / editare */}
      <PatientFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        isLoading={createPatient.isPending || updatePatient.isPending}
        editData={editDetail}
        isLoadingData={isLoadingEditDetail}
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
        onEdit={canModify && detailPatientId ? () => {
          const id = detailPatientId
          setDetailPatientId(null)
          handleOpenEdit(id)
        } : undefined}
      />

      <ConfirmDeleteDialog
        name={deleteTarget?.fullName}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deletePatient.isPending}
      />

    </div>
  )
}

export default PatientsListPage
