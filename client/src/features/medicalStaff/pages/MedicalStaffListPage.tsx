import { useState, useRef, useCallback, useMemo } from 'react'
import {
  type GridComponent,
  ColumnsDirective,
  ColumnDirective,
} from '@syncfusion/ej2-react-grids'
import { AppDataGrid, useGridExport } from '@/components/data-display/AppDataGrid'
import type { MedicalStaffDto, MedicalStaffStatusFilter } from '../types/medicalStaff.types'
import type { MedicalStaffFormData } from '../schemas/medicalStaff.schema'
import { useMedicalStaffList, useCreateMedicalStaff, useUpdateMedicalStaff, useDeleteMedicalStaff } from '../hooks/useMedicalStaff'
import { useMedicalTitles } from '@/features/nomenclature/hooks/useMedicalTitles'
import { useDepartments } from '@/features/departments/hooks/useDepartments'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { MedicalStaffFormModal } from '../components/MedicalStaffFormModal/MedicalStaffFormModal'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { formatDate } from '@/utils/format'
import styles from './MedicalStaffListPage.module.scss'

// ── Icoane SVG inline ─────────────────────────────────────────────────────────
const IconPlus    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconExcel   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;

const IconSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconStaff   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (first?: string | null, last?: string | null) =>
  `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || '?';

// ── Configurare grid ──────────────────────────────────────────────────────────
const SORT_SETTINGS = { columns: [{ field: 'fullName' as const, direction: 'Ascending' as const }] }

// ── Componenta principală ─────────────────────────────────────────────────────
export const MedicalStaffListPage = () => {
  const gridRef = useRef<GridComponent>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<MedicalStaffStatusFilter>('all')
  const [departmentFilter, setDepartmentFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // Modal formular
  const [modalOpen, setModalOpen] = useState(false)
  const [editingStaff, setEditingStaff] = useState<MedicalStaffDto | null>(null)

  // Confirmare ștergere
  const [deleteTarget, setDeleteTarget] = useState<MedicalStaffDto | null>(null)

  // Mesaje feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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

  const staffList = staffResp?.data?.items ?? []
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
    setEditingStaff(null)
    setErrorMsg(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (staff: MedicalStaffDto) => {
    setEditingStaff(staff)
    setErrorMsg(null)
    setModalOpen(true)
  }

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

  // ── Export handlers (hook reutilizabil) ─────────────────────────────────────
  const { handleExcelExport } = useGridExport(gridRef, {
    fileNamePrefix: 'personal_medical',
    buildExportData,
  })

  // ── Cell templates ─────────────────────────────────────────────────────────
  const nameTemplate = useCallback((row: MedicalStaffDto) => (
    <div className={styles.avatarCell}>
      <div className={styles.avatar}>{getInitials(row.firstName, row.lastName)}</div>
      <div>
        <div className={styles.staffName}>{row.fullName}</div>
        <div className={styles.staffEmail}>{row.email}</div>
      </div>
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

  const statusTemplate = useCallback((row: MedicalStaffDto) => (
    <AppBadge variant={row.isActive ? 'success' : 'neutral'} withDot>
      {row.isActive ? 'Activ' : 'Inactiv'}
    </AppBadge>
  ), [])

  const actionsTemplate = useCallback((row: MedicalStaffDto) => (
    <ActionButtons
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
    );
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Personal Medical</h1>
          <p className={styles.pageSubtitle}>Gestionare asistenți, infirmieri, moașe, farmaciști și alt personal</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={handleExcelExport}>
            <IconExcel /> Export Excel
          </button>
          <button className={styles.btnPrimary} onClick={handleOpenCreate}>
            <IconPlus /> Personal nou
          </button>
        </div>
      </div>

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
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}><IconSearch /></span>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Caută după nume, email, titulatură..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

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

        <div className={styles.toolbarDivider} />

        <div className={styles.statusPills}>
          {(['all', 'active', 'inactive'] as MedicalStaffStatusFilter[]).map(s => (
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
              field="fullName"
              headerText="Angajat"
              width="230"
              minWidth="180"
              template={nameTemplate}
              allowGrouping={false}
            />

            <ColumnDirective
              field="medicalTitleName"
              headerText="Titulatură"
              width="160"
              minWidth="120"
              template={titleTemplate}
            />

            <ColumnDirective
              field="departmentName"
              headerText="Departament"
              width="150"
              minWidth="110"
              template={departmentTemplate}
            />

            <ColumnDirective
              field="supervisorName"
              headerText="Doctor supervizor"
              width="180"
              minWidth="140"
              template={supervisorTemplate}
            />

            <ColumnDirective
              field="phoneNumber"
              headerText="Telefon"
              width="130"
              minWidth="100"
              defaultValue="—"
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

      {/* Dialog confirmare ștergere */}
      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h6 className={styles.confirmTitle}>Confirmare ștergere</h6>
            <p className={styles.confirmText}>
              Sigur dorești să ștergi pe <strong>{deleteTarget.fullName}</strong>?
            </p>
            <div className={styles.confirmActions}>
              <AppButton variant="outline-secondary" size="sm" onClick={() => setDeleteTarget(null)}>
                Anulează
              </AppButton>
              <AppButton
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                isLoading={deleteStaff.isPending}
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

export default MedicalStaffListPage
