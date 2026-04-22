import { useState, useRef, useCallback, useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import type { ColDef, GridApi } from '@/components/data-display/AppDataGrid'
import { AppDataGrid } from '@/components/data-display/AppDataGrid'
import type { MedicalStaffDto, MedicalStaffStatusFilter } from '../types/medicalStaff.types'
import type { MedicalStaffFormData } from '../schemas/medicalStaff.schema'
import { useMedicalStaffList, useCreateMedicalStaff, useUpdateMedicalStaff, useDeleteMedicalStaff } from '../hooks/useMedicalStaff'
import { useMedicalTitles } from '@/features/nomenclature/hooks/useMedicalTitles'
import { useDepartments } from '@/features/departments/hooks/useDepartments'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { MedicalStaffFormModal } from '../components/MedicalStaffFormModal/MedicalStaffFormModal'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge, ActiveBadge } from '@/components/ui/AppBadge'
import { formatDate, toLocalDateISO, getInitials } from '@/utils/format'
import { phoneCellTemplate } from '@/components/data-display/PhoneCell'
import { useFeedback } from '@/hooks/useFeedback'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { FeedbackAlerts } from '@/components/ui/FeedbackAlerts'
import { ListPageToolbar } from '@/components/ui/ListPageToolbar'
import { IconPlus, IconExcel } from '@/components/ui/Icons'
import styles from './MedicalStaffListPage.module.scss'

// \u2500\u2500 Icoane specifice paginii \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const IconStaff   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;

// \u2500\u2500 Helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
// ── Componenta principală ─────────────────────────────────────────────────────
export const MedicalStaffListPage = () => {
  const gridRef = useRef<GridApi<MedicalStaffDto>>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MedicalStaffStatusFilter>('all')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [page] = useState(1)
  const [pageSize] = useState(20)

  // Modal formular
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<MedicalStaffDto | null>(null)

  // Confirmare ștergere
  const [deleteTarget, setDeleteTarget] = useState<MedicalStaffDto | null>(null)

  // Mesaje feedback
  const { successMsg, errorMsg, showSuccess, showError, setSuccessMsg, setErrorMsg } = useFeedback()

  // Date reale din API
  const { data: staffResp, isLoading, isError } = useMedicalStaffList({
    page,
    pageSize,
    search: search || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    sortBy: 'fullName',
    sortDir: 'asc',
  })

  // Date auxiliare pentru modal
  const { data: medicalTitlesResp } = useMedicalTitles(true)
  const { data: departmentsResp } = useDepartments(true)
  const { data: lookupResp } = useDoctorLookup()

  // Mutații
  const createStaff = useCreateMedicalStaff()
  const updateStaff = useUpdateMedicalStaff()
  const deleteStaff = useDeleteMedicalStaff()

  const staffList = useMemo(() => staffResp?.data?.items ?? [], [staffResp])
  const totalCount = staffResp?.data?.totalCount ?? 0
  const medicalTitles = medicalTitlesResp?.data ?? []
  const departments = departmentsResp?.data ?? []
  const doctorLookup = lookupResp?.data ?? []

  // Filtrare locală doar pentru departament (restul se face server-side)
  const filteredData = departmentFilter
    ? staffList.filter(s => s.departmentName === departmentFilter)
    : staffList

  // Statistici compute din datele curente
  const totalActive   = staffList.filter(s => s.isActive).length
  const totalInactive = staffList.filter(s => !s.isActive).length
  const departmentNames = useMemo(
    () => [...new Set(staffList.map(s => s.departmentName).filter(Boolean))].sort() as string[],
    [staffList],
  )

  // ── Modal handlers ─────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingStaff(null)
    setErrorMsg(null)
    setModalOpen(true)
  }

  const handleOpenEdit = useCallback((staff: MedicalStaffDto) => {
    setEditingStaff(staff)
    setErrorMsg(null)
    setModalOpen(true)
  }, [setErrorMsg])

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingStaff(null)
    setErrorMsg(null)
  }

  const handleFormSubmit = (formData: MedicalStaffFormData) => {
    // Transformare: string gol → null pentru câmpurile opționale
    const toNull = (v: string | undefined) => v || null

    if (editingStaff) {
      updateStaff.mutate(
        {
          id: editingStaff.id,
          departmentId: toNull(formData.departmentId),
          supervisorDoctorId: toNull(formData.supervisorDoctorId),
          medicalTitleId: toNull(formData.medicalTitleId),
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: toNull(formData.phoneNumber),
          isActive: formData.isActive,
        },
        {
          onSuccess: () => { handleCloseModal(); showSuccess('Membrul personalului medical a fost actualizat cu succes.') },
          onError: (err) => showError(err),
        },
      )
    } else {
      createStaff.mutate(
        {
          departmentId: toNull(formData.departmentId),
          supervisorDoctorId: toNull(formData.supervisorDoctorId),
          medicalTitleId: toNull(formData.medicalTitleId),
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: toNull(formData.phoneNumber),
        },
        {
          onSuccess: () => { handleCloseModal(); showSuccess('Membrul personalului medical a fost adăugat cu succes.') },
          onError: (err) => showError(err),
        },
      )
    }
  }

  // ── Confirmare ștergere ────────────────────────────────────────────────────
  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteStaff.mutate(deleteTarget.id, {
      onSuccess: () => { setDeleteTarget(null); showSuccess('Membrul personalului medical a fost șters cu succes.') },
      onError: (err) => { setDeleteTarget(null); showError(err) },
    })
  }

  // Date transformate pentru export — plain objects, fără template JSX
  const buildExportData = useCallback(() =>
    filteredData.map(s => ({
      fullName:         s.fullName,
      medicalTitleName: s.medicalTitleName ?? '—',
      departmentName:   s.departmentName ?? '—',
      supervisorName:   s.supervisorName ?? '—',
      email:            s.email,
      phoneNumber:      s.phoneNumber ?? '—',
      isActive:         s.isActive ? 'Activ' : 'Inactiv',
      createdAt:        s.createdAt ? formatDate(s.createdAt) : '—',
    }))
  , [filteredData])

  // ── Export handler ─────────────────────────────────────────────────────────
  const handleExcelExport = useCallback(() => {
    gridRef.current?.exportExcel({
      fileName: `personal_medical_${toLocalDateISO(new Date())}`,
      customData: buildExportData(),
    })
  }, [buildExportData])

  // ── Cell templates ─────────────────────────────────────────────────────────
  const avatarTemplate = useCallback((row: MedicalStaffDto) => (
    <div className={styles.avatar}>{getInitials(row.firstName, row.lastName)}</div>
  ), []);

  const nameTemplate = useCallback((row: MedicalStaffDto) => (
    <div className={styles.staffInfo}>
      <div className={styles.staffName}>{row.fullName}</div>
      <div className={styles.staffEmail}>{row.email}</div>
    </div>
  ), []);

  const titleTemplate = useCallback((row: MedicalStaffDto) =>
    row.medicalTitleName
      ? <AppBadge variant="primary">{row.medicalTitleName}</AppBadge>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , [])

  const departmentTemplate = useCallback((row: MedicalStaffDto) =>
    row.departmentName
      ? <span style={{ fontSize: '0.85rem' }}>{row.departmentName}</span>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , [])

  const supervisorTemplate = useCallback((row: MedicalStaffDto) =>
    row.supervisorName
      ? <span style={{ fontSize: '0.85rem' }}>{row.supervisorName}</span>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , [])

  const statusTemplate = useCallback((row: MedicalStaffDto) => <ActiveBadge isActive={row.isActive} />, [])

  const actionsTemplate = useCallback((row: MedicalStaffDto) => (
    <ActionButtons
      onEdit={() => handleOpenEdit(row)}
      onDelete={() => setDeleteTarget(row)}
    />
  ), [handleOpenEdit])

  // ── Column definitions ─────────────────────────────────────────────────────
  const columnDefs = useMemo<ColDef<MedicalStaffDto>[]>(() => [
    {
      headerName: '',
      width: 50,
      minWidth: 50,
      maxWidth: 50,
      sortable: false,
      filterable: false,
      resizable: false,
      reorderable: false,
      cellRenderer: ({ data }) => avatarTemplate(data),
    },
    {
      field: 'fullName',
      headerName: 'Angajat',
      width: 200,
      minWidth: 150,
      cellRenderer: ({ data }) => nameTemplate(data),
    },
    {
      field: 'medicalTitleName',
      headerName: 'Titulatură',
      width: 160,
      minWidth: 120,
      cellRenderer: ({ data }) => titleTemplate(data),
    },
    {
      field: 'departmentName',
      headerName: 'Departament',
      width: 150,
      minWidth: 110,
      cellRenderer: ({ data }) => departmentTemplate(data),
    },
    {
      field: 'supervisorName',
      headerName: 'Doctor supervizor',
      width: 180,
      minWidth: 140,
      cellRenderer: ({ data }) => supervisorTemplate(data),
    },
    {
      field: 'phoneNumber',
      headerName: 'Telefon',
      width: 160,
      minWidth: 130,
      cellRenderer: ({ data }) => phoneCellTemplate(data as unknown as Record<string, unknown>),
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
  ], [avatarTemplate, nameTemplate, titleTemplate, departmentTemplate, supervisorTemplate, statusTemplate, actionsTemplate])

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
      <PageHeader
        title="Personal Medical"
        subtitle="Gestionare asistenți, infirmieri, moașe, farmaciști și alt personal"
        actions={
          <>
            <button className={styles.btnSecondary} onClick={handleExcelExport}>
              <IconExcel /> Export Excel
            </button>
            <button className={styles.btnPrimary} onClick={handleOpenCreate}>
              <IconPlus /> Personal nou
            </button>
          </>
        }
      />

      {/* Stats */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--blue']}`}><IconStaff /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalCount}</span>
            <span className={styles.statLabel}>Total personal</span>
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
            <span className={styles.statValue}>{departmentNames.length}</span>
            <span className={styles.statLabel}>Departamente</span>
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
      <ListPageToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Caută după nume, email, titulatură..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'all' as MedicalStaffStatusFilter, label: 'Toți' },
          { value: 'active' as MedicalStaffStatusFilter, label: 'Activi' },
          { value: 'inactive' as MedicalStaffStatusFilter, label: 'Inactivi' },
        ]}
        filters={
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Departament:</span>
            <select
              className={styles.filterSelect}
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
            >
              <option value="">Toate</option>
              {departmentNames.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        }
      />

      {/* Grid */}
      <div className={styles.gridWrapper}>
      <AppDataGrid<MedicalStaffDto>
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
      <MedicalStaffFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        isLoading={createStaff.isPending || updateStaff.isPending}
        editData={editingStaff}
        medicalTitles={medicalTitles}
        departments={departments}
        doctorLookup={doctorLookup}
        serverError={modalOpen ? errorMsg : null}
      />

      <ConfirmDeleteDialog
        name={deleteTarget?.fullName}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteStaff.isPending}
      />

    </div>
  )
}

export default MedicalStaffListPage
