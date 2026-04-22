import { useState, useRef, useCallback, useMemo } from 'react'
import type { ColDef, GridApi } from '@/components/data-display/AppDataGrid'
import { AppDataGrid } from '@/components/data-display/AppDataGrid'
import type { DoctorDto, DoctorStatusFilter } from '../types/doctor.types'
import type { DoctorFormData } from '../schemas/doctor.schema'
import { useDoctors, useCreateDoctor, useUpdateDoctor, useDeleteDoctor, useDoctorLookup } from '../hooks/useDoctors'
import { useSpecialties } from '@/features/nomenclature/hooks/useSpecialties'
import { useMedicalTitles } from '@/features/nomenclature/hooks/useMedicalTitles'
import { useDepartments } from '@/features/departments/hooks/useDepartments'
import { DoctorFormModal } from '../components/DoctorFormModal/DoctorFormModal'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge, ActiveBadge } from '@/components/ui/AppBadge'
import { formatDate, toLocalDateISO, getInitials } from '@/utils/format'
import { phoneCellTemplate } from '@/components/data-display/PhoneCell'
import { useFeedback } from '@/hooks/useFeedback'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { FeedbackAlerts } from '@/components/ui/FeedbackAlerts'
import { IconPlus, IconExcel, IconSearch } from '@/components/ui/Icons'
import styles from './DoctorsListPage.module.scss'

// \u2500\u2500 Icoane specifice paginii \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const IconMedic   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 2h-1A1.5 1.5 0 002 3.5v5A6.5 6.5 0 008.5 15h1A6.5 6.5 0 0016 8.5v-5A1.5 1.5 0 0014.5 2h-1"/><path d="M16 9a4 4 0 014 4 4 4 0 01-4 4m0 0v3"/><circle cx="16" cy="20" r="1"/></svg>;

// \u2500\u2500 Helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

const getLicenseClass = (expiresAt: string | null): string => {
  if (!expiresAt) return '';
  const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (days < 0)   return styles['licenseExpiry--expired'];
  if (days < 60)  return styles['licenseExpiry--warning'];
  return styles['licenseExpiry--ok'];
};

// ── Componenta principală ─────────────────────────────────────────────────────
export const DoctorsListPage = () => {
  const gridRef = useRef<GridApi<DoctorDto>>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DoctorStatusFilter>('all')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [page] = useState(1)
  const [pageSize] = useState(20)

  // Modal formular
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<DoctorDto | null>(null)

  // Confirmare ștergere
  const [deleteTarget, setDeleteTarget] = useState<DoctorDto | null>(null)

  // Mesaje feedback
  const { successMsg, errorMsg, showSuccess, showError, setSuccessMsg, setErrorMsg } = useFeedback()

  // Date reale din API
  const { data: doctorsResp, isLoading, isError } = useDoctors({
    page,
    pageSize,
    search: search || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    sortBy: 'fullName',
    sortDir: 'asc',
  })

  // Date auxiliare pentru modal
  const { data: specialtiesResp } = useSpecialties(true)
  const { data: medicalTitlesResp } = useMedicalTitles(true)
  const { data: departmentsResp } = useDepartments(true)
  const { data: lookupResp } = useDoctorLookup()

  // Mutații
  const createDoctor = useCreateDoctor()
  const updateDoctor = useUpdateDoctor()
  const deleteDoctor = useDeleteDoctor()

  const doctors = useMemo(() => doctorsResp?.data?.items ?? [], [doctorsResp])
  const totalCount = doctorsResp?.data?.totalCount ?? 0
  const allSpecialties = specialtiesResp?.data ?? []
  const medicalTitles = medicalTitlesResp?.data ?? []
  const departments = departmentsResp?.data ?? []
  const doctorLookup = lookupResp?.data ?? []

  // Filtrare locală doar pentru specialitate (restul se face server-side)
  const filteredData = specialtyFilter
    ? doctors.filter(d => d.specialtyName === specialtyFilter)
    : doctors

  // Statistici compute din datele curente
  const totalActive   = doctors.filter(d => d.isActive).length
  const totalInactive = doctors.filter(d => !d.isActive).length
  const specialties   = useMemo(
    () => [...new Set(doctors.map(d => d.specialtyName).filter(Boolean))].sort() as string[],
    [doctors],
  )

  // ── Modal handlers ─────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingDoctor(null)
    setErrorMsg(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (doctor: DoctorDto) => {
    setEditingDoctor(doctor)
    setErrorMsg(null)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingDoctor(null)
    setErrorMsg(null)
  }

  const handleFormSubmit = (formData: DoctorFormData) => {
    // Transformare: string gol → null pentru câmpurile opționale
    const toNull = (v: string | undefined) => v || null

    if (editingDoctor) {
      updateDoctor.mutate(
        {
          id: editingDoctor.id,
          departmentId: toNull(formData.departmentId),
          supervisorDoctorId: toNull(formData.supervisorDoctorId),
          specialtyId: toNull(formData.specialtyId),
          subspecialtyId: toNull(formData.subspecialtyId),
          medicalTitleId: toNull(formData.medicalTitleId),
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: toNull(formData.phoneNumber),
          medicalCode: toNull(formData.medicalCode),
          licenseNumber: toNull(formData.licenseNumber),
          licenseExpiresAt: toNull(formData.licenseExpiresAt),
          isActive: formData.isActive,
        },
        {
          onSuccess: () => { handleCloseModal(); showSuccess('Doctorul a fost actualizat cu succes.') },
          onError: (err) => showError(err),
        },
      )
    } else {
      createDoctor.mutate(
        {
          departmentId: toNull(formData.departmentId),
          supervisorDoctorId: toNull(formData.supervisorDoctorId),
          specialtyId: toNull(formData.specialtyId),
          subspecialtyId: toNull(formData.subspecialtyId),
          medicalTitleId: toNull(formData.medicalTitleId),
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: toNull(formData.phoneNumber),
          medicalCode: toNull(formData.medicalCode),
          licenseNumber: toNull(formData.licenseNumber),
          licenseExpiresAt: toNull(formData.licenseExpiresAt),
        },
        {
          onSuccess: () => { handleCloseModal(); showSuccess('Doctorul a fost adăugat cu succes.') },
          onError: (err) => showError(err),
        },
      )
    }
  }

  // ── Confirmare ștergere ────────────────────────────────────────────────────
  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteDoctor.mutate(deleteTarget.id, {
      onSuccess: () => { setDeleteTarget(null); showSuccess('Doctorul a fost șters cu succes.') },
      onError: (err) => { setDeleteTarget(null); showError(err) },
    })
  }

  // Date transformate pentru export — plain objects, fără template JSX
  const buildExportData = useCallback(() =>
    filteredData.map(d => ({
      fullName:            d.fullName,
      specialtyName:       d.specialtyName ?? '—',
      subspecialtyName:    d.subspecialtyName ?? '—',
      departmentName:      d.departmentName ?? '—',
      medicalCode:         d.medicalCode   ?? '—',
      licenseNumber:       d.licenseNumber ?? '—',
      licenseExpiresAt:    d.licenseExpiresAt ? formatDate(d.licenseExpiresAt) : '—',
      phoneNumber:         d.phoneNumber   ?? '—',
      isActive:            d.isActive ? 'Activ' : 'Inactiv',
      createdAt:           d.createdAt ? formatDate(d.createdAt) : '—',
    }))
  , [filteredData])

  // ── Export handler ─────────────────────────────────────────────────────────
  const handleExcelExport = useCallback(() => {
    gridRef.current?.exportExcel({
      fileName: `doctori_${toLocalDateISO(new Date())}`,
      customData: buildExportData(),
    })
  }, [buildExportData])

  // ── Cell templates ─────────────────────────────────────────────────────────
  const avatarTemplate = useCallback((row: DoctorDto) => (
    <div className={styles.avatar}>{getInitials(row.firstName, row.lastName)}</div>
  ), []);

  const nameTemplate = useCallback((row: DoctorDto) => (
    <span className={styles.doctorName}>{row.fullName}</span>
  ), []);

  const specialtyTemplate = useCallback((row: DoctorDto) =>
    row.specialtyName
      ? <AppBadge variant="primary">{row.specialtyName}</AppBadge>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , [])

  const subspecialtyTemplate = useCallback((row: DoctorDto) =>
    row.subspecialtyName
      ? <AppBadge variant="primary">{row.subspecialtyName}</AppBadge>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , [])

  const departmentTemplate = useCallback((row: DoctorDto) =>
    row.departmentName
      ? <span style={{ fontSize: '0.85rem' }}>{row.departmentName}</span>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , [])

  const medicalCodeTemplate = useCallback((row: DoctorDto) =>
    row.medicalCode
      ? <AppBadge variant="primary" mono>{row.medicalCode}</AppBadge>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , []);

  const licenseTemplate = useCallback((row: DoctorDto) => {
    if (!row.licenseExpiresAt) return <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>;
    return (
      <span className={`${styles.licenseExpiry} ${getLicenseClass(row.licenseExpiresAt)}`}>
        {formatDate(row.licenseExpiresAt)}
      </span>
    );
  }, []);

  const statusTemplate = useCallback((row: DoctorDto) => <ActiveBadge isActive={row.isActive} />, [])

  const actionsTemplate = useCallback((row: DoctorDto) => (
    <ActionButtons
      onEdit={() => handleOpenEdit(row)}
      onDelete={() => setDeleteTarget(row)}
    />
  ), [])

  // ── Column definitions ─────────────────────────────────────────────────────
  const columnDefs = useMemo<ColDef<DoctorDto>[]>(() => [
    {
      headerName: '',
      width: 55,
      minWidth: 55,
      maxWidth: 55,
      sortable: false,
      filterable: false,
      resizable: false,
      reorderable: false,
      cellRenderer: ({ data }) => avatarTemplate(data),
    },
    {
      field: 'fullName',
      headerName: 'Doctor',
      width: 170,
      minWidth: 130,
      cellRenderer: ({ data }) => nameTemplate(data),
    },
    {
      field: 'specialtyName',
      headerName: 'Specialitate',
      width: 150,
      minWidth: 120,
      cellRenderer: ({ data }) => specialtyTemplate(data),
    },
    {
      field: 'subspecialtyName',
      headerName: 'Subspecializare',
      width: 150,
      minWidth: 120,
      hide: true,
      cellRenderer: ({ data }) => subspecialtyTemplate(data),
    },
    {
      field: 'departmentName',
      headerName: 'Departament',
      width: 140,
      minWidth: 110,
      cellRenderer: ({ data }) => departmentTemplate(data),
    },
    {
      field: 'medicalCode',
      headerName: 'Parafă',
      width: 110,
      minWidth: 90,
      cellRenderer: ({ data }) => medicalCodeTemplate(data),
    },
    {
      field: 'licenseNumber',
      headerName: 'Nr. CMR',
      width: 120,
      minWidth: 100,
      hide: true,
      ellipsis: true,
    },
    {
      field: 'licenseExpiresAt',
      headerName: 'Aviz expiră',
      width: 130,
      minWidth: 110,
      hide: true,
      cellRenderer: ({ data }) => licenseTemplate(data),
    },
    {
      field: 'phoneNumber',
      headerName: 'Telefon',
      width: 160,
      minWidth: 130,
      cellRenderer: ({ data }) => phoneCellTemplate(data as unknown as Record<string, unknown>),
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 180,
      minWidth: 140,
      ellipsis: true,
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 110,
      minWidth: 90,
      cellRenderer: ({ data }) => statusTemplate(data),
    },
    {
      field: 'createdAt',
      headerName: 'Înregistrat',
      width: 120,
      minWidth: 100,
      filterType: 'date',
      hide: true,
      ellipsis: true,
      valueFormatter: ({ value }) => value ? formatDate(value as string) : '',
    },
    {
      field: 'id',
      headerName: '',
      width: 80,
      minWidth: 70,
      sortable: false,
      filterable: false,
      resizable: false,
      reorderable: false,
      pinned: 'right',
      cellRenderer: ({ data }) => actionsTemplate(data),
    },
  ], [avatarTemplate, nameTemplate, specialtyTemplate, subspecialtyTemplate, departmentTemplate, medicalCodeTemplate, licenseTemplate, statusTemplate, actionsTemplate])

  // ── Render ─────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div className={styles.page}>
        <div className="alert alert-danger m-4">
          Nu s-au putut încărca datele. Verifică conexiunea la server.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Doctori</h1>
          <p className={styles.pageSubtitle}>Gestionare medici, specialități și avize CMR</p>
        </div>
        <div className={styles.headerActions}>
          {/* TODO: Export PDF — dezactivat temporar, de revenit */}
          <button className={styles.btnSecondary} onClick={handleExcelExport}>
            <IconExcel /> Export Excel
          </button>
          <button className={styles.btnPrimary} onClick={handleOpenCreate}>
            <IconPlus /> Doctor nou
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--blue']}`}><IconMedic /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalCount}</span>
            <span className={styles.statLabel}>Total doctori</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--green']}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalActive}</span>
            <span className={styles.statLabel}>Activi</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--orange']}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{specialties.length}</span>
            <span className={styles.statLabel}>Specialități</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--gray']}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalInactive}</span>
            <span className={styles.statLabel}>Inactivi</span>
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
            placeholder="Caută după nume, email, parafă, specialitate..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Specialitate:</span>
          <select
            className={styles.filterSelect}
            value={specialtyFilter}
            onChange={e => setSpecialtyFilter(e.target.value)}
          >
            <option value="">Toate</option>
            {specialties.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.statusPills}>
          {(['all', 'active', 'inactive'] as DoctorStatusFilter[]).map(s => (
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
      <div className={styles.gridWrapper}>
      <AppDataGrid<DoctorDto>
        ref={gridRef}
        rowData={filteredData}
        columnDefs={columnDefs}
        initialSort={[{ field: 'fullName', direction: 'asc' }]}
        loading={isLoading}
        getRowId={(row) => row.id}
        // Paginare
        pagination
        pageSize={20}
        pageSizes={[10, 20, 50, 100]}
        showPager
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
          { type: 'total-count' },
          { type: 'filtered-count' },
          { type: 'selected-count' },
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

      <FeedbackAlerts
        successMsg={successMsg}
        onDismissSuccess={() => setSuccessMsg(null)}
      />

      {/* Modal creare / editare */}
      <DoctorFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        isLoading={createDoctor.isPending || updateDoctor.isPending}
        editData={editingDoctor}
        specialties={allSpecialties}
        medicalTitles={medicalTitles}
        departments={departments}
        doctorLookup={doctorLookup}
        serverError={modalOpen ? errorMsg : null}
      />

      <ConfirmDeleteDialog
        name={deleteTarget?.fullName}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteDoctor.isPending}
      />

    </div>
  )
}

export default DoctorsListPage
