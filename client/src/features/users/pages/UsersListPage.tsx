import { useState, useRef, useCallback, useMemo } from 'react'
import type { ColDef, GridApi } from '@/components/data-display/AppDataGrid'
import { AppDataGrid } from '@/components/data-display/AppDataGrid'
import type { UserDto } from '../types/user.types'
import type { CreateUserFormData } from '../schemas/user.schema'
import type { ChangePasswordFormData } from '../schemas/user.schema'
import { useUsersList, useCreateUser, useUpdateUser, useDeleteUser, useChangePassword, useRoles } from '../hooks/useUsers'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { useMedicalStaffLookup } from '@/features/medicalStaff/hooks/useMedicalStaff'
import { useHasAccess, MODULE, ACCESS_LEVEL } from '@/hooks/useHasAccess'
import { UserFormModal } from '../components/UserFormModal/UserFormModal'
import { ChangePasswordModal } from '../components/ChangePasswordModal/ChangePasswordModal'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge, ActiveBadge, type BadgeVariant } from '@/components/ui/AppBadge'
import { formatDate, toLocalDateISO, getInitials } from '@/utils/format'
import { useFeedback } from '@/hooks/useFeedback'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { FeedbackAlerts } from '@/components/ui/FeedbackAlerts'
import { IconPlus, IconExcel, IconSearch } from '@/components/ui/Icons'
import styles from './UsersListPage.module.scss'

// \u2500\u2500 Icoane specifice paginii \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
const IconUsers   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const IconKey     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 010-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>

// \u2500\u2500 Helpers \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
type StatusFilter = 'all' | 'active' | 'inactive'

// Mapare culoare per rol
const roleVariantMap: Record<string, BadgeVariant> = {
  admin:          'critical',
  doctor:         'primary',
  nurse:          'success',
  receptionist:   'accent',
  clinic_manager: 'purple',
}

// ── Access denied fallback ───────────────────────────────────────────────────
const AccessDenied = () => (
  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
    <h3>Acces interzis</h3>
    <p>Nu ai permisiunile necesare pentru a accesa această pagină.</p>
  </div>
)

// ── Componenta principală ─────────────────────────────────────────────────────
export const UsersListPage = () => {
  const { hasAccess } = useHasAccess()
  const canManageUsers = hasAccess(MODULE.Users, ACCESS_LEVEL.Read)

  const gridRef = useRef<GridApi<UserDto>>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [roleFilter, setRoleFilter] = useState('')
  const [page] = useState(1)
  const [pageSize] = useState(20)

  // Modal formular creare/editare
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserDto | null>(null)

  // Modal schimbare parolă
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const [passwordTarget, setPasswordTarget] = useState<UserDto | null>(null)

  // Confirmare ștergere
  const [deleteTarget, setDeleteTarget] = useState<UserDto | null>(null)

  // Mesaje feedback
  const { successMsg, errorMsg, showSuccess, showError, setSuccessMsg, setErrorMsg } = useFeedback()

  // Date reale din API
  const { data: usersResp, isLoading, isError } = useUsersList({
    page,
    pageSize,
    search: search || undefined,
    roleId: roleFilter || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    sortBy: 'lastName',
    sortDir: 'asc',
  }, { enabled: canManageUsers })

  // Date auxiliare pentru modal
  const { data: rolesResp } = useRoles({ enabled: canManageUsers })
  const { data: doctorsResp } = useDoctorLookup({ enabled: canManageUsers })
  const { data: staffResp } = useMedicalStaffLookup({ enabled: canManageUsers })

  // Mutații
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const changePassword = useChangePassword()

  // ── Computed data (useMemo/useCallback MUST be before any conditional return) ──
  const userList = useMemo(() => usersResp?.data?.items ?? [], [usersResp])
  const filteredData = useMemo(
    () => roleFilter ? userList.filter(u => u.roleId === roleFilter) : userList,
    [roleFilter, userList],
  )
  const roleNames = useMemo(
    () => [...new Set(userList.map(u => u.roleName).filter(Boolean))].sort() as string[],
    [userList],
  )

  // Date transformate pentru export — plain objects, fără template JSX
  const buildExportData = useCallback(() =>
    filteredData.map(u => ({
      fullName:       `${u.lastName} ${u.firstName}`,
      username:       u.username,
      email:          u.email,
      roleName:       u.roleName,
      association:    u.doctorName ?? u.medicalStaffName ?? '—',
      isActive:       u.isActive ? 'Activ' : 'Inactiv',
      lastLoginAt:    u.lastLoginAt ? formatDate(u.lastLoginAt) : '—',
      createdAt:      u.createdAt ? formatDate(u.createdAt) : '—',
    }))
  , [filteredData])

  // ── Export handler ─────────────────────────────────────────────────────────
  const handleExcelExport = useCallback(() => {
    gridRef.current?.exportExcel({
      fileName: `utilizatori_${toLocalDateISO(new Date())}`,
      customData: buildExportData(),
    })
  }, [buildExportData])

  // ── Cell templates ─────────────────────────────────────────────────────────
  const avatarTemplate = useCallback((row: UserDto) => (
    <div className={styles.avatar}>{getInitials(row.firstName, row.lastName)}</div>
  ), [])

  const nameTemplate = useCallback((row: UserDto) => (
    <div className={styles.userInfo}>
      <div className={styles.userName}>{row.lastName} {row.firstName}</div>
      <div className={styles.userEmail}>{row.username} • {row.email}</div>
    </div>
  ), [])

  const roleTemplate = useCallback((row: UserDto) => (
    <AppBadge variant={roleVariantMap[row.roleCode] ?? 'neutral'}>
      {row.roleName}
    </AppBadge>
  ), [])

  const associationTemplate = useCallback((row: UserDto) => {
    if (row.doctorName) {
      return (
        <div>
          <span className={styles.assocLabel}>Doctor</span>
          <span className={styles.assocValue}>{row.doctorName}</span>
        </div>
      )
    }
    if (row.medicalStaffName) {
      return (
        <div>
          <span className={styles.assocLabel}>Personal</span>
          <span className={styles.assocValue}>{row.medicalStaffName}</span>
        </div>
      )
    }
    return <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  }, [])

  const statusTemplate = useCallback((row: UserDto) => <ActiveBadge isActive={row.isActive} />, [])

  const lastLoginTemplate = useCallback((row: UserDto) =>
    row.lastLoginAt
      ? <span style={{ fontSize: '0.85rem' }}>{formatDate(row.lastLoginAt)}</span>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>Niciodată</span>
  , [])

  // ── Handlers referenced by actionsTemplate (must be declared before it) ──
  const handleOpenPasswordModal = (user: UserDto) => {
    setPasswordTarget(user)
    setErrorMsg(null)
    setPasswordModalOpen(true)
  }

  const handleOpenEdit = (user: UserDto) => {
    setEditingUser(user)
    setErrorMsg(null)
    setModalOpen(true)
  }

  const actionsTemplate = useCallback((row: UserDto) => (
    <div className={styles.actionBtns}>
      <button className={styles.iconBtn} title="Schimbă parola" onClick={() => handleOpenPasswordModal(row)}>
        <IconKey />
      </button>
      <ActionButtons
        onEdit={() => handleOpenEdit(row)}
        onDelete={() => setDeleteTarget(row)}
      />
    </div>
  ), [])

  // ── Column definitions ─────────────────────────────────────────────────────
  const columnDefs = useMemo<ColDef<UserDto>[]>(() => [
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
      field: 'lastName',
      headerName: 'Utilizator',
      width: 200,
      minWidth: 150,
      cellRenderer: ({ data }) => nameTemplate(data),
    },
    {
      field: 'roleName',
      headerName: 'Rol',
      width: 150,
      minWidth: 110,
      cellRenderer: ({ data }) => roleTemplate(data),
    },
    {
      field: 'doctorName',
      headerName: 'Asociere',
      width: 200,
      minWidth: 150,
      cellRenderer: ({ data }) => associationTemplate(data),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 110,
      minWidth: 90,
      cellRenderer: ({ data }) => statusTemplate(data),
    },
    {
      field: 'lastLoginAt',
      headerName: 'Ultima autentificare',
      width: 160,
      minWidth: 130,
      cellRenderer: ({ data }) => lastLoginTemplate(data),
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
      width: 120,
      minWidth: 110,
      sortable: false,
      filterable: false,
      resizable: false,
      reorderable: false,
      pinned: 'right',
      cellRenderer: ({ data }) => actionsTemplate(data),
    },
  ], [avatarTemplate, nameTemplate, roleTemplate, associationTemplate, statusTemplate, lastLoginTemplate, actionsTemplate])

  if (!canManageUsers) return <AccessDenied />

  const totalCount = usersResp?.data?.totalCount ?? 0
  const roles = rolesResp?.data ?? []
  const doctorLookup = doctorsResp?.data ?? []
  const staffLookup = staffResp?.data ?? []

  // Statistici
  const totalActive   = userList.filter(u => u.isActive).length
  const totalInactive = userList.filter(u => !u.isActive).length

  // ── Modal handlers ─────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingUser(null)
    setErrorMsg(null)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingUser(null)
    setErrorMsg(null)
  }

  const handleFormSubmit = (formData: CreateUserFormData) => {
    const toNull = (v: string | undefined) => v || null

    if (editingUser) {
      updateUser.mutate(
        {
          id: editingUser.id,
          roleId: formData.roleId,
          doctorId: formData.associationType === 'doctor' ? toNull(formData.doctorId) : null,
          medicalStaffId: formData.associationType === 'medicalStaff' ? toNull(formData.medicalStaffId) : null,
          username: formData.username,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          isActive: formData.isActive,
        },
        {
          onSuccess: () => { handleCloseModal(); showSuccess('Utilizatorul a fost actualizat cu succes.') },
          onError: (err) => showError(err),
        },
      )
    } else {
      createUser.mutate(
        {
          roleId: formData.roleId,
          doctorId: formData.associationType === 'doctor' ? toNull(formData.doctorId) : null,
          medicalStaffId: formData.associationType === 'medicalStaff' ? toNull(formData.medicalStaffId) : null,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          isActive: formData.isActive,
        },
        {
          onSuccess: () => { handleCloseModal(); showSuccess('Utilizatorul a fost creat cu succes.') },
          onError: (err) => showError(err),
        },
      )
    }
  }

  // ── Password modal handlers ────────────────────────────────────────────────
  const handleClosePasswordModal = () => {
    setPasswordModalOpen(false)
    setPasswordTarget(null)
    setErrorMsg(null)
  }

  const handlePasswordSubmit = (formData: ChangePasswordFormData) => {
    if (!passwordTarget) return
    changePassword.mutate(
      { userId: passwordTarget.id, payload: { newPassword: formData.newPassword } },
      {
        onSuccess: () => { handleClosePasswordModal(); showSuccess('Parola a fost schimbată cu succes.') },
        onError: (err) => showError(err),
      },
    )
  }

  // ── Confirmare ștergere ────────────────────────────────────────────────────
  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteUser.mutate(deleteTarget.id, {
      onSuccess: () => { setDeleteTarget(null); showSuccess('Utilizatorul a fost șters cu succes.') },
      onError: (err) => { setDeleteTarget(null); showError(err) },
    })
  }

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
          <h1 className={styles.pageTitle}>Utilizatori</h1>
          <p className={styles.pageSubtitle}>Gestionare conturi de acces — fiecare utilizator este asociat unui doctor sau personal medical</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={handleExcelExport}>
            <IconExcel /> Export Excel
          </button>
          <button className={styles.btnPrimary} onClick={handleOpenCreate}>
            <IconPlus /> Utilizator nou
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--blue']}`}><IconUsers /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{totalCount}</span>
            <span className={styles.statLabel}>Total utilizatori</span>
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          </div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{roleNames.length}</span>
            <span className={styles.statLabel}>Roluri</span>
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
            placeholder="Caută după nume, username, email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Rol:</span>
          <select
            className={styles.filterSelect}
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="">Toate</option>
            {roles.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
        </div>

        <div className={styles.toolbarDivider} />

        <div className={styles.statusPills}>
          {(['all', 'active', 'inactive'] as StatusFilter[]).map(s => (
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
      <AppDataGrid<UserDto>
        ref={gridRef}
        rowData={filteredData}
        columnDefs={columnDefs}
        initialSort={[{ field: 'lastName', direction: 'asc' }]}
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
      <UserFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        isLoading={createUser.isPending || updateUser.isPending}
        editData={editingUser}
        roles={roles}
        doctorLookup={doctorLookup}
        staffLookup={staffLookup}
        serverError={modalOpen ? errorMsg : null}
      />

      {/* Modal schimbare parolă */}
      <ChangePasswordModal
        isOpen={passwordModalOpen}
        onClose={handleClosePasswordModal}
        onSubmit={handlePasswordSubmit}
        isLoading={changePassword.isPending}
        userName={passwordTarget ? `${passwordTarget.lastName} ${passwordTarget.firstName}` : ''}
        serverError={passwordModalOpen ? errorMsg : null}
      />

      <ConfirmDeleteDialog
        name={deleteTarget ? `${deleteTarget.lastName} ${deleteTarget.firstName}` : null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteUser.isPending}
      />

    </div>
  )
}

export default UsersListPage
