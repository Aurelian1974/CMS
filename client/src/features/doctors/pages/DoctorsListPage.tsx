import { useState, useRef, useCallback, useMemo } from 'react'
import {
  type GridComponent,
  ColumnsDirective,
  ColumnDirective,
} from '@syncfusion/ej2-react-grids'
import { AppDataGrid, useGridExport } from '@/components/data-display/AppDataGrid'
import type { DoctorDto, DoctorStatusFilter } from '../types/doctor.types'
import type { DoctorFormData } from '../schemas/doctor.schema'
import { useDoctors, useCreateDoctor, useUpdateDoctor, useDeleteDoctor, useDoctorLookup } from '../hooks/useDoctors'
import { useSpecialties } from '@/features/nomenclature/hooks/useSpecialties'
import { useMedicalTitles } from '@/features/nomenclature/hooks/useMedicalTitles'
import { useDepartments } from '@/features/departments/hooks/useDepartments'
import { DoctorFormModal } from '../components/DoctorFormModal/DoctorFormModal'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge } from '@/components/ui/AppBadge'
import { formatDate, formatDateTime } from '@/utils/format'
import styles from './DoctorsListPage.module.scss'

// ── Icoane SVG inline ─────────────────────────────────────────────────────────
const IconPlus    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IconExcel   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>;
const IconPdf     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M10 12.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5-.7 1.5-1.5 1.5H10v2"/></svg>;

const IconSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IconLock    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
const IconMedic   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4.5 2h-1A1.5 1.5 0 002 3.5v5A6.5 6.5 0 008.5 15h1A6.5 6.5 0 0016 8.5v-5A1.5 1.5 0 0014.5 2h-1"/><path d="M16 9a4 4 0 014 4 4 4 0 01-4 4m0 0v3"/><circle cx="16" cy="20" r="1"/></svg>;

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (first?: string | null, last?: string | null) =>
  `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || '?';

const getLicenseClass = (expiresAt: string | null): string => {
  if (!expiresAt) return '';
  const days = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
  if (days < 0)   return styles['licenseExpiry--expired'];
  if (days < 60)  return styles['licenseExpiry--warning'];
  return styles['licenseExpiry--ok'];
};

// ── Configurare grid ──────────────────────────────────────────────────────────
const SORT_SETTINGS = { columns: [{ field: 'fullName' as const, direction: 'Ascending' as const }] }

// ── Componenta principală ─────────────────────────────────────────────────────
export const DoctorsListPage = () => {
  const gridRef = useRef<GridComponent>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<DoctorStatusFilter>('all')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)

  // Modal formular
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState<DoctorDto | null>(null)

  // Confirmare ștergere
  const [deleteTarget, setDeleteTarget] = useState<DoctorDto | null>(null)

  // Mesaje feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

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

  const doctors = doctorsResp?.data?.items ?? []
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

  // ── Export handlers (hook reutilizabil) ─────────────────────────────────────
  const { handleExcelExport } = useGridExport(gridRef, {
    fileNamePrefix: 'doctori',
    buildExportData,
  })

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

  const statusTemplate = useCallback((row: DoctorDto) => (
    <AppBadge variant={row.isActive ? 'success' : 'neutral'} withDot>
      {row.isActive ? 'Activ' : 'Inactiv'}
    </AppBadge>
  ), [])

  const actionsTemplate = useCallback((row: DoctorDto) => (
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
              headerText="Doctor"
              width="170"
              minWidth="130"
              template={nameTemplate}
              allowGrouping={false}
            />

            <ColumnDirective
              field="specialtyName"
              headerText="Specialitate"
              width="150"
              minWidth="120"
              template={specialtyTemplate}
            />

            <ColumnDirective
              field="subspecialtyName"
              headerText="Subspecializare"
              width="150"
              minWidth="120"
              template={subspecialtyTemplate}
              visible={false}
            />

            <ColumnDirective
              field="departmentName"
              headerText="Departament"
              width="140"
              minWidth="110"
              template={departmentTemplate}
            />

            <ColumnDirective
              field="medicalCode"
              headerText="Parafă"
              width="110"
              minWidth="90"
              template={medicalCodeTemplate}
            />

            <ColumnDirective
              field="licenseNumber"
              headerText="Nr. CMR"
              width="120"
              minWidth="100"
              defaultValue="—"
              clipMode="EllipsisWithTooltip"
              visible={false}
            />

            <ColumnDirective
              field="licenseExpiresAt"
              headerText="Aviz expiră"
              width="130"
              minWidth="110"
              template={licenseTemplate}
              visible={false}
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

      {/* Dialog confirmare ștergere */}
      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h6 className={styles.confirmTitle}>Confirmare ștergere</h6>
            <p className={styles.confirmText}>
              Sigur dorești să ștergi doctorul <strong>{deleteTarget.fullName}</strong>?
            </p>
            <div className={styles.confirmActions}>
              <button className="btn btn-outline-secondary btn-sm" onClick={() => setDeleteTarget(null)}>
                Anulează
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={handleConfirmDelete}
                disabled={deleteDoctor.isPending}
              >
                {deleteDoctor.isPending ? 'Se șterge...' : 'Șterge'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default DoctorsListPage
