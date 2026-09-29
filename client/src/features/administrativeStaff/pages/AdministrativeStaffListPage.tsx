import { useState, useRef, useCallback, useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import type { ColDef, GridApi } from '@/components/data-display/AppDataGrid'
import { AppDataGrid } from '@/components/data-display/AppDataGrid'
import type { AdministrativeStaffDto, AdministrativeStaffStatusFilter } from '../types/administrativeStaff.types'
import type { AdministrativeStaffFormData } from '../schemas/administrativeStaff.schema'
import {
  useAdministrativeStaffList,
  useAdministrativePositions,
  useCreateAdministrativeStaff,
  useUpdateAdministrativeStaff,
  useDeleteAdministrativeStaff,
} from '../hooks/useAdministrativeStaff'
import { useDepartments } from '@/features/departments/hooks/useDepartments'
import { AdministrativeStaffFormModal } from '../components/AdministrativeStaffFormModal/AdministrativeStaffFormModal'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge, ActiveBadge } from '@/components/ui/AppBadge'
import { formatDate, toLocalDateISO, getInitials } from '@/utils/format'
import { phoneCellTemplate } from '@/components/data-display/PhoneCell'
import { useFeedback } from '@/hooks/useFeedback'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { FeedbackAlerts } from '@/components/ui/FeedbackAlerts'
import { ListPageToolbar } from '@/components/ui/ListPageToolbar'
import { IconPlus, IconExcel } from '@/components/ui/Icons'
import styles from './AdministrativeStaffListPage.module.scss'

const IconStaff = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16" /></svg>

const Empty = () => <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>

export const AdministrativeStaffListPage = () => {
  const gridRef = useRef<GridApi<AdministrativeStaffDto>>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AdministrativeStaffStatusFilter>('all')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [page] = useState(1)
  const [pageSize] = useState(20)

  const [modalOpen, setModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<AdministrativeStaffDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdministrativeStaffDto | null>(null)

  const { successMsg, errorMsg, showSuccess, showError, setSuccessMsg, setErrorMsg } = useFeedback()

  const { data: staffResp, isLoading, isError } = useAdministrativeStaffList({
    page,
    pageSize,
    search: search || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    sortBy: 'LastName',
    sortDir: 'asc',
  })

  const { data: positionsResp } = useAdministrativePositions()
  const { data: departmentsResp } = useDepartments(true)

  const createStaff = useCreateAdministrativeStaff()
  const updateStaff = useUpdateAdministrativeStaff()
  const deleteStaff = useDeleteAdministrativeStaff()

  const staffList = useMemo(() => staffResp?.data?.items ?? [], [staffResp])
  const totalCount = staffResp?.data?.totalCount ?? 0
  const positions = positionsResp?.data ?? []
  const departments = departmentsResp?.data ?? []

  // Filtrare locală doar pentru departament (restul se face server-side)
  const filteredData = departmentFilter
    ? staffList.filter(s => s.departmentName === departmentFilter)
    : staffList

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

  const handleOpenEdit = useCallback((staff: AdministrativeStaffDto) => {
    setEditingStaff(staff)
    setErrorMsg(null)
    setModalOpen(true)
  }, [setErrorMsg])

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingStaff(null)
    setErrorMsg(null)
  }

  const handleFormSubmit = (formData: AdministrativeStaffFormData) => {
    const toNull = (v: string | undefined) => v || null
    const payload = {
      departmentId: toNull(formData.departmentId),
      positionId: toNull(formData.positionId),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phoneNumber: toNull(formData.phoneNumber),
    }

    if (editingStaff) {
      updateStaff.mutate(
        { ...payload, id: editingStaff.id, isActive: formData.isActive },
        {
          onSuccess: () => { handleCloseModal(); showSuccess('Membrul personalului administrativ a fost actualizat cu succes.') },
          onError: (err) => showError(err),
        },
      )
    } else {
      createStaff.mutate(payload, {
        onSuccess: () => { handleCloseModal(); showSuccess('Membrul personalului administrativ a fost adăugat cu succes.') },
        onError: (err) => showError(err),
      })
    }
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteStaff.mutate(deleteTarget.id, {
      onSuccess: () => { setDeleteTarget(null); showSuccess('Membrul personalului administrativ a fost șters cu succes.') },
      onError: (err) => { setDeleteTarget(null); showError(err) },
    })
  }

  // ── Export ─────────────────────────────────────────────────────────────────
  const buildExportData = useCallback(() =>
    filteredData.map(s => ({
      fullName:       s.fullName,
      positionName:   s.positionName ?? '—',
      departmentName: s.departmentName ?? '—',
      email:          s.email,
      phoneNumber:    s.phoneNumber ?? '—',
      isActive:       s.isActive ? 'Activ' : 'Inactiv',
      createdAt:      s.createdAt ? formatDate(s.createdAt) : '—',
    }))
  , [filteredData])

  const handleExcelExport = useCallback(() => {
    gridRef.current?.exportExcel({
      fileName: `personal_administrativ_${toLocalDateISO(new Date())}`,
      customData: buildExportData(),
    })
  }, [buildExportData])

  // ── Cell templates ─────────────────────────────────────────────────────────
  const avatarTemplate = useCallback((row: AdministrativeStaffDto) => (
    <div className={styles.avatar}>{getInitials(row.firstName, row.lastName)}</div>
  ), [])

  const nameTemplate = useCallback((row: AdministrativeStaffDto) => (
    <div className={styles.staffInfo}>
      <div className={styles.staffName}>{row.fullName}</div>
      <div className={styles.staffEmail}>{row.email}</div>
    </div>
  ), [])

  const positionTemplate = useCallback((row: AdministrativeStaffDto) =>
    row.positionName ? <AppBadge variant="accent">{row.positionName}</AppBadge> : <Empty />
  , [])

  const departmentTemplate = useCallback((row: AdministrativeStaffDto) =>
    row.departmentName ? <span style={{ fontSize: '0.85rem' }}>{row.departmentName}</span> : <Empty />
  , [])

  const statusTemplate = useCallback((row: AdministrativeStaffDto) => <ActiveBadge isActive={row.isActive} />, [])

  const actionsTemplate = useCallback((row: AdministrativeStaffDto) => (
    <ActionButtons
      onEdit={() => handleOpenEdit(row)}
      onDelete={() => setDeleteTarget(row)}
    />
  ), [handleOpenEdit])

  const columnDefs = useMemo<ColDef<AdministrativeStaffDto>[]>(() => [
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
      width: 220,
      minWidth: 150,
      cellRenderer: ({ data }) => nameTemplate(data),
    },
    {
      field: 'positionName',
      headerName: 'Funcție',
      width: 160,
      minWidth: 120,
      cellRenderer: ({ data }) => positionTemplate(data),
    },
    {
      field: 'departmentName',
      headerName: 'Departament',
      width: 160,
      minWidth: 110,
      cellRenderer: ({ data }) => departmentTemplate(data),
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
  ], [avatarTemplate, nameTemplate, positionTemplate, departmentTemplate, statusTemplate, actionsTemplate])

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
        title="Personal Administrativ"
        subtitle="Gestionare recepționeri, manageri, administratori și alt personal non-medical"
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

      <ListPageToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Caută după nume, email, funcție..."
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        statusOptions={[
          { value: 'all' as AdministrativeStaffStatusFilter, label: 'Toți' },
          { value: 'active' as AdministrativeStaffStatusFilter, label: 'Activi' },
          { value: 'inactive' as AdministrativeStaffStatusFilter, label: 'Inactivi' },
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

      <div className={styles.gridWrapper}>
        <AppDataGrid<AdministrativeStaffDto>
          ref={gridRef}
          rowData={filteredData}
          columnDefs={columnDefs}
          initialSort={[{ field: 'fullName', direction: 'asc' }]}
          loading={isLoading}
          getRowId={(row) => row.id}
          pagination
          pageSize={20}
          pageSizes={[10, 20, 50, 100]}
          showPager
          triStateSort
          multiSortKey="ctrl"
          showFilterRow
          rowSelection="multiple"
          showGroupPanel
          groupDefaultExpanded={1}
          toolbar
          contextMenu
          statusBar={[
            { type: 'total-count' },
            { type: 'filtered-count' },
            { type: 'selected-count' },
          ]}
          alternateRows
          enableHover
          gridLines="horizontal"
          stickyHeader
          rowDragEnabled
        />
      </div>

      <FeedbackAlerts
        successMsg={successMsg}
        onDismissSuccess={() => setSuccessMsg(null)}
      />

      <AdministrativeStaffFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        isLoading={createStaff.isPending || updateStaff.isPending}
        editData={editingStaff}
        positions={positions}
        departments={departments}
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

export default AdministrativeStaffListPage
