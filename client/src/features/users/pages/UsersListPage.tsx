import { useState, useRef, useCallback, useMemo } from 'react'
import {
  GridComponent,
  ColumnsDirective,
  ColumnDirective,
  Inject,
  Page,
  Sort,
  Filter,
  Group,
  Reorder,
  Resize,
  ExcelExport,
  PdfExport,
  ColumnChooser,
  type FilterSettingsModel,
  type GroupSettingsModel,
  type PageSettingsModel,
  type SortSettingsModel,
  type ExcelExportProperties,
} from '@syncfusion/ej2-react-grids'
import type { UserDto } from '../types/user.types'
import type { CreateUserFormData } from '../schemas/user.schema'
import type { ChangePasswordFormData } from '../schemas/user.schema'
import { useUsersList, useCreateUser, useUpdateUser, useDeleteUser, useChangePassword, useRoles } from '../hooks/useUsers'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { useMedicalStaffLookup } from '@/features/medicalStaff/hooks/useMedicalStaff'
import { UserFormModal } from '../components/UserFormModal/UserFormModal'
import { ChangePasswordModal } from '../components/ChangePasswordModal/ChangePasswordModal'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { formatDate } from '@/utils/format'
import styles from './UsersListPage.module.scss'

// ── Icoane SVG inline ─────────────────────────────────────────────────────────
const IconPlus    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconExcel   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
const IconColumns = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg>
const IconSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IconUsers   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const IconKey     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 010-7.778zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (first?: string | null, last?: string | null) =>
  `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || '?'

type StatusFilter = 'all' | 'active' | 'inactive'

// Mapare culoare per rol
const roleColorMap: Record<string, string> = {
  admin:          'roleBadge--admin',
  doctor:         'roleBadge--doctor',
  nurse:          'roleBadge--nurse',
  receptionist:   'roleBadge--receptionist',
  clinic_manager: 'roleBadge--manager',
}

// ── Configurare grid ──────────────────────────────────────────────────────────
const filterSettings: FilterSettingsModel = { type: 'Menu', showFilterBarStatus: true }

const groupSettings: GroupSettingsModel = {
  showDropArea: true,
  showGroupedColumn: false,
  showToggleButton: true,
  showUngroupButton: true,
}

const pageSettings: PageSettingsModel = { pageSize: 10, pageSizes: [5, 10, 20, 50] }

const sortSettings: SortSettingsModel = {
  columns: [{ field: 'lastName', direction: 'Ascending' }],
}

// ── Componenta principală ─────────────────────────────────────────────────────
export const UsersListPage = () => {
  const gridRef = useRef<GridComponent>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
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
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Date reale din API
  const { data: usersResp, isLoading, isError } = useUsersList({
    page,
    pageSize,
    search: search || undefined,
    roleId: roleFilter || undefined,
    isActive: statusFilter === 'all' ? undefined : statusFilter === 'active',
    sortBy: 'lastName',
    sortDir: 'asc',
  })

  // Date auxiliare pentru modal
  const { data: rolesResp } = useRoles()
  const { data: doctorsResp } = useDoctorLookup()
  const { data: staffResp } = useMedicalStaffLookup()

  // Mutații
  const createUser = useCreateUser()
  const updateUser = useUpdateUser()
  const deleteUser = useDeleteUser()
  const changePassword = useChangePassword()

  const userList = usersResp?.data?.items ?? []
  const totalCount = usersResp?.data?.totalCount ?? 0
  const roles = rolesResp?.data ?? []
  const doctorLookup = doctorsResp?.data ?? []
  const staffLookup = staffResp?.data ?? []

  // Filtrare locală suplimentară pentru role (server-side deja, dar keep local filter in sync)
  const filteredData = roleFilter
    ? userList.filter(u => u.roleId === roleFilter)
    : userList

  // Statistici
  const totalActive   = userList.filter(u => u.isActive).length
  const totalInactive = userList.filter(u => !u.isActive).length
  const roleNames = useMemo(
    () => [...new Set(userList.map(u => u.roleName).filter(Boolean))].sort() as string[],
    [userList],
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
    setEditingUser(null)
    setErrorMsg(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (user: UserDto) => {
    setEditingUser(user)
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
  const handleOpenPasswordModal = (user: UserDto) => {
    setPasswordTarget(user)
    setErrorMsg(null)
    setPasswordModalOpen(true)
  }

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

  // ── Export handlers ────────────────────────────────────────────────────────
  const handleExcelExport = useCallback(() => {
    const grid = gridRef.current
    if (!grid) return

    const columns = grid.getColumns() as Array<Record<string, unknown>>
    const saved = new Map<string, unknown>()
    columns.forEach(col => {
      if (col.template) {
        saved.set(col.field as string, col.template)
        col.template = null
      }
    })

    const props: ExcelExportProperties = {
      fileName: `utilizatori_${new Date().toISOString().slice(0, 10)}.xlsx`,
      dataSource: buildExportData(),
    }

    const restore = () => {
      columns.forEach(col => {
        const key = col.field as string
        if (saved.has(key)) col.template = saved.get(key)
      })
      grid.refreshColumns()
    }

    const result = grid.excelExport(props) as unknown as Promise<unknown>
    result?.then?.(restore).catch((err: unknown) => {
      console.error('Excel export error:', err)
      restore()
    })
  }, [buildExportData])

  // ── Cell templates ─────────────────────────────────────────────────────────
  const nameTemplate = useCallback((row: UserDto) => (
    <div className={styles.avatarCell}>
      <div className={styles.avatar}>{getInitials(row.firstName, row.lastName)}</div>
      <div>
        <div className={styles.userName}>{row.lastName} {row.firstName}</div>
        <div className={styles.userEmail}>{row.username} • {row.email}</div>
      </div>
    </div>
  ), [])

  const roleTemplate = useCallback((row: UserDto) => (
    <span className={`${styles.roleBadge} ${styles[roleColorMap[row.roleCode] ?? 'roleBadge--default']}`}>
      {row.roleName}
    </span>
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

  const statusTemplate = useCallback((row: UserDto) => (
    <span className={`${styles.statusBadge} ${styles[row.isActive ? 'statusBadge--active' : 'statusBadge--inactive']}`}>
      {row.isActive ? 'Activ' : 'Inactiv'}
    </span>
  ), [])

  const lastLoginTemplate = useCallback((row: UserDto) =>
    row.lastLoginAt
      ? <span style={{ fontSize: '0.85rem' }}>{formatDate(row.lastLoginAt)}</span>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>Niciodată</span>
  , [])

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

        <div className={styles.toolbarRight}>
          <button
            className={styles.btnSecondary}
            onClick={() => gridRef.current?.openColumnChooser()}
          >
            <IconColumns /> Coloane
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className={styles.gridContainer}>
        <GridComponent
          ref={gridRef}
          dataSource={filteredData}
          allowSorting
          allowFiltering
          allowGrouping
          allowReordering
          allowResizing
          allowPaging
          allowExcelExport
          allowPdfExport
          showColumnChooser
          enableStickyHeader
          enableHover
          filterSettings={filterSettings}
          groupSettings={groupSettings}
          pageSettings={pageSettings}
          sortSettings={sortSettings}
          height="auto"
          gridLines="Horizontal"
          rowHeight={52}
        >
          <ColumnsDirective>

            <ColumnDirective
              field="lastName"
              headerText="UTILIZATOR"
              width="230"
              minWidth="180"
              template={nameTemplate}
              allowGrouping={false}
            />

            <ColumnDirective
              field="roleName"
              headerText="ROL"
              width="150"
              minWidth="110"
              template={roleTemplate}
            />

            <ColumnDirective
              field="doctorName"
              headerText="ASOCIERE"
              width="200"
              minWidth="150"
              template={associationTemplate}
            />

            <ColumnDirective
              field="isActive"
              headerText="STATUS"
              width="110"
              minWidth="90"
              template={statusTemplate}
            />

            <ColumnDirective
              field="lastLoginAt"
              headerText="ULTIMA AUTENTIFICARE"
              width="160"
              minWidth="130"
              template={lastLoginTemplate}
            />

            <ColumnDirective
              field="createdAt"
              headerText="ÎNREGISTRAT"
              width="120"
              minWidth="100"
              format="dd.MM.yyyy"
              type="date"
            />

            <ColumnDirective
              field="id"
              headerText=""
              width="120"
              minWidth="110"
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

          <Inject services={[
            Page, Sort, Filter, Group,
            Reorder, Resize,
            ExcelExport, PdfExport, ColumnChooser,
          ]} />
        </GridComponent>
      </div>

      {/* Mesaj succes */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show mt-3" role="alert">
          {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg(null)} />
        </div>
      )}

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

      {/* Dialog confirmare ștergere */}
      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h6 className={styles.confirmTitle}>Confirmare ștergere</h6>
            <p className={styles.confirmText}>
              Sigur dorești să ștergi utilizatorul <strong>{deleteTarget.lastName} {deleteTarget.firstName}</strong>?
            </p>
            <div className={styles.confirmActions}>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setDeleteTarget(null)}>
                Anulează
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleConfirmDelete}
                disabled={deleteUser.isPending}
              >
                {deleteUser.isPending ? 'Se șterge...' : 'Șterge'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default UsersListPage
