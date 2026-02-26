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
  type PdfExportProperties,
} from '@syncfusion/ej2-react-grids'
import type { PatientDto, PatientStatusFilter } from '../types/patient.types'
import type { PatientFormData } from '../schemas/patient.schema'
import { usePatients, useCreatePatient, useUpdatePatient, useDeletePatient } from '../hooks/usePatients'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { useGenders, useBloodTypes, useAllergyTypes, useAllergySeverities } from '@/features/nomenclature/hooks/useNomenclatureLookups'
import { PatientFormModal } from '../components/PatientFormModal/PatientFormModal'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { formatDate } from '@/utils/format'
import styles from './PatientsListPage.module.scss'

// ── Icoane SVG inline ─────────────────────────────────────────────────────────
const IconPlus    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconExcel   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
const IconColumns = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg>
const IconSearch  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IconUsers   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>
const IconAlert   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (first?: string | null, last?: string | null) =>
  `${(first ?? '').charAt(0)}${(last ?? '').charAt(0)}`.toUpperCase() || '?'

/** Clase CSS pentru badge severitate alergie */
const getSeverityClass = (code: string | null): string => {
  if (!code) return ''
  switch (code.toUpperCase()) {
    case 'ANAPHYLAXIS': return styles['severity--anaphylaxis']
    case 'SEVERE':      return styles['severity--severe']
    case 'MODERATE':    return styles['severity--moderate']
    case 'MILD':        return styles['severity--mild']
    default:            return ''
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
const filterSettings: FilterSettingsModel = { type: 'Menu', showFilterBarStatus: true }
const groupSettings: GroupSettingsModel = { showDropArea: true, showGroupedColumn: false, showToggleButton: true, showUngroupButton: true }
const pageSettings: PageSettingsModel = { pageSize: 10, pageSizes: [5, 10, 20, 50] }
const sortSettings: SortSettingsModel = { columns: [{ field: 'fullName', direction: 'Ascending' }] }

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

  // ── Export handlers ────────────────────────────────────────────────────────
  const handleExcelExport = useCallback(() => {
    const grid = gridRef.current
    if (!grid) return

    const columns = grid.getColumns() as Array<Record<string, unknown>>
    const saved = new Map<string, unknown>()
    columns.forEach(col => {
      if (col.template) { saved.set(col.field as string, col.template); col.template = null }
    })

    const props: ExcelExportProperties = {
      fileName: `pacienti_${new Date().toISOString().slice(0, 10)}.xlsx`,
      dataSource: buildExportData(),
    }

    const restore = () => {
      columns.forEach(col => { const key = col.field as string; if (saved.has(key)) col.template = saved.get(key) })
      grid.refreshColumns()
    }

    const result = grid.excelExport(props) as unknown as Promise<unknown>
    result?.then?.(restore).catch((err: unknown) => { console.error('Excel export error:', err); restore() })
  }, [buildExportData])

  const handlePdfExport = useCallback(() => {
    const grid = gridRef.current
    if (!grid) return

    const columns = grid.getColumns() as Array<Record<string, unknown>>
    const saved = new Map<string, unknown>()
    columns.forEach(col => {
      if (col.template) { saved.set(col.field as string, col.template); col.template = null }
    })

    const props: PdfExportProperties = {
      fileName: `pacienti_${new Date().toISOString().slice(0, 10)}.pdf`,
      pageOrientation: 'Landscape',
      dataSource: buildExportData(),
      theme: {
        header: { bold: true, fontColor: '#ffffff', fontName: 'Helvetica', fontSize: 10 },
        record: { fontName: 'Helvetica', fontSize: 9 },
      },
    }

    const restore = () => {
      columns.forEach(col => { const key = col.field as string; if (saved.has(key)) col.template = saved.get(key) })
      grid.refreshColumns()
    }

    const result = grid.pdfExport(props) as unknown as Promise<unknown>
    result?.then?.(restore).catch((err: unknown) => { console.error('PDF export error:', err); restore() })
  }, [buildExportData])

  // ── Cell templates ─────────────────────────────────────────────────────────
  const nameTemplate = useCallback((row: PatientDto) => (
    <div className={styles.avatarCell}>
      <div className={styles.avatar}>{getInitials(row.firstName, row.lastName)}</div>
      <div>
        <div className={styles.patientName}>{row.fullName}</div>
        <div className={styles.patientMeta}>
          {row.age != null ? `${row.age} ani` : ''}
          {row.age != null && row.genderName ? ' · ' : ''}
          {row.genderName ?? ''}
        </div>
      </div>
    </div>
  ), [])

  const cnpTemplate = useCallback((row: PatientDto) => (
    <span className={styles.cnpCode}>{row.cnp}</span>
  ), [])

  const bloodTypeTemplate = useCallback((row: PatientDto) =>
    row.bloodTypeName
      ? <span className={styles.bloodTypeBadge}>{row.bloodTypeName}</span>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , [])

  const allergyTemplate = useCallback((row: PatientDto) => {
    if (row.allergyCount === 0) return <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
    return (
      <div className={styles.allergyCell}>
        <span className={`${styles.severityBadge} ${getSeverityClass(row.maxAllergySeverityCode)}`}>
          {row.allergyCount} {row.allergyCount === 1 ? 'alergie' : 'alergii'}
        </span>
        <span className={styles.severityLabel}>{getSeverityLabel(row.maxAllergySeverityCode)}</span>
      </div>
    )
  }, [])

  const doctorTemplate = useCallback((row: PatientDto) =>
    row.primaryDoctorName
      ? <span style={{ fontSize: '0.85rem' }}>{row.primaryDoctorName}</span>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , [])

  const statusTemplate = useCallback((row: PatientDto) => (
    <span className={`${styles.statusBadge} ${styles[row.isActive ? 'statusBadge--active' : 'statusBadge--inactive']}`}>
      {row.isActive ? 'Activ' : 'Inactiv'}
    </span>
  ), [])

  const actionsTemplate = useCallback((row: PatientDto) => (
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
              field="fullName"
              headerText="PACIENT"
              width="220"
              minWidth="180"
              template={nameTemplate}
              allowGrouping={false}
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
              headerText="GRUPĂ SANGUINĂ"
              width="130"
              minWidth="110"
              template={bloodTypeTemplate}
            />

            <ColumnDirective
              field="allergyCount"
              headerText="ALERGII"
              width="150"
              minWidth="120"
              template={allergyTemplate}
            />

            <ColumnDirective
              field="primaryDoctorName"
              headerText="MEDIC PRIMAR"
              width="160"
              minWidth="130"
              template={doctorTemplate}
            />

            <ColumnDirective
              field="phoneNumber"
              headerText="TELEFON"
              width="130"
              minWidth="100"
              defaultValue="—"
            />

            <ColumnDirective
              field="email"
              headerText="EMAIL"
              width="180"
              minWidth="140"
              defaultValue="—"
              visible={false}
            />

            <ColumnDirective
              field="isActive"
              headerText="STATUS"
              width="110"
              minWidth="90"
              template={statusTemplate}
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
