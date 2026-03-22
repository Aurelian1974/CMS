import { useState, useRef, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AppDataGrid } from '@/components/data-display/AppDataGrid'
import type { ColDef, GridApi, PaginationChangedEvent, SortChangedEvent } from '@/components/data-display/AppDataGrid'
import type { AppointmentDto, AppointmentStatusFilter, CreateAppointmentPayload, UpdateAppointmentPayload } from '../types/appointment.types'
import { useAppointments, useDeleteAppointment, useCreateAppointment, useUpdateAppointment } from '../hooks/useAppointments'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { usePatientLookup } from '@/features/patients/hooks/usePatients'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge, type BadgeVariant } from '@/components/ui/AppBadge'
import { AppButton } from '@/components/ui/AppButton'
import { FormDatePicker } from '@/components/forms/FormDatePicker'
import { formatDate } from '@/utils/format'
import { phoneCellTemplate } from '@/components/data-display/PhoneCell'
import { AppointmentFormModal } from '../components/AppointmentFormModal/AppointmentFormModal'
import { AppointmentDetailModal } from '../components/AppointmentDetailModal/AppointmentDetailModal'
import styles from './AppointmentsListPage.module.scss'

// ── Icoane SVG inline ─────────────────────────────────────────────────────────
const IconPlus     = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const IconExcel    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
const IconSearch   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const IconCalendar = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
const IconCheck    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
const IconClock    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
const IconX        = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const IconScheduler = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="9" y1="2" x2="9" y2="6"/><line x1="15" y1="2" x2="15" y2="6"/><rect x="6" y="13" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.3"/><rect x="14" y="13" width="4" height="3" rx="0.5" fill="currentColor" opacity="0.3"/></svg>

// ── Helpers ───────────────────────────────────────────────────────────────────
/** Mapare cod status → variantă AppBadge */
const getStatusVariant = (code: string | null): BadgeVariant => {
  if (!code) return 'neutral'
  switch (code.toUpperCase()) {
    case 'PROGRAMAT':    return 'primary'
    case 'CONFIRMAT':    return 'success'
    case 'FINALIZAT':    return 'neutral'
    case 'ANULAT':       return 'danger'
    case 'NEPREZENTARE': return 'warning'
    default:             return 'neutral'
  }
}

/** Formatare ore (HH:mm) */
const formatTime = (dateStr: string): string => {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })
}

/** Formatare data + ora */
const formatDateTime = (dateStr: string): string => {
  const d = new Date(dateStr)
  return `${d.toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })} ${d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })}`
}

/** Mapare filtru status → GUID statusId real din DB */
const APPOINTMENT_STATUS_IDS: Record<Exclude<AppointmentStatusFilter, 'all'>, string> = {
  scheduled: 'a1000000-0000-0000-0000-000000000001',
  confirmed: 'a1000000-0000-0000-0000-000000000002',
  completed: 'a1000000-0000-0000-0000-000000000003',
  cancelled: 'a1000000-0000-0000-0000-000000000004',
}

// ── Componenta principală ─────────────────────────────────────────────────────
export const AppointmentsListPage = () => {
  const navigate = useNavigate()
  const gridRef = useRef<GridApi<AppointmentDto>>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<AppointmentStatusFilter>('all')
  const [doctorId, setDoctorId] = useState<string | undefined>(undefined)
  const [dateFrom, setDateFrom] = useState<string | undefined>(undefined)
  const [dateTo, setDateTo] = useState<string | undefined>(undefined)

  // Starea grid-ului server-side (pagina, sortare)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState('startTime')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // Starea modalelor
  const [formModalOpen, setFormModalOpen] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<AppointmentDto | null>(null)
  const [detailAppointmentId, setDetailAppointmentId] = useState<string | null>(null)
  const [serverError, setServerError] = useState<string | null>(null)

  // Confirmare ștergere
  const [deleteTarget, setDeleteTarget] = useState<AppointmentDto | null>(null)

  // Mesaje feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Mini form pentru filtrele de dată (necesar pentru FormDatePicker)
  const { control: filterDateControl } = useForm<{ dateFrom: string; dateTo: string }>({
    defaultValues: { dateFrom: '', dateTo: '' },
  })

  // Date reale din API — paginare + sortare + filtrare complet server-side
  const { data: appointmentsResp, isError } = useAppointments({
    page,
    pageSize,
    search:   search || undefined,
    doctorId,
    statusId: statusFilter === 'all' ? undefined : APPOINTMENT_STATUS_IDS[statusFilter],
    dateFrom,
    dateTo,
    sortBy,
    sortDir,
  })

  // Date auxiliare
  const { data: doctorLookupResp } = useDoctorLookup()
  const { data: patientLookupResp } = usePatientLookup()

  // Mutații
  const deleteAppointment = useDeleteAppointment()
  const createAppointment = useCreateAppointment()
  const updateAppointment = useUpdateAppointment()

  const appointments = useMemo(() => appointmentsResp?.data?.pagedResult?.items ?? [], [appointmentsResp])
  const totalCount   = appointmentsResp?.data?.pagedResult?.totalCount ?? 0
  const stats        = appointmentsResp?.data?.stats

  const doctorLookup = doctorLookupResp?.data ?? []
  const patientLookup = patientLookupResp?.data ?? []

  // ── Handlers CRUD modale ───────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditingAppointment(null)
    setServerError(null)
    setFormModalOpen(true)
  }

  const handleOpenEdit = (row: AppointmentDto) => {
    setEditingAppointment(row)
    setServerError(null)
    setFormModalOpen(true)
  }

  const handleOpenDetail = (row: AppointmentDto) => {
    setDetailAppointmentId(row.id)
  }

  const handleEditFromDetail = () => {
    const appointment = appointments.find(a => a.id === detailAppointmentId)
    if (appointment) {
      setDetailAppointmentId(null)
      handleOpenEdit(appointment)
    }
  }

  const handleFormSubmit = (data: CreateAppointmentPayload | UpdateAppointmentPayload) => {
    const isEdit = 'id' in data
    const mutation = isEdit ? updateAppointment : createAppointment
    mutation.mutate(data as never, {
      onSuccess: () => {
        setFormModalOpen(false)
        setEditingAppointment(null)
        showSuccess(isEdit ? 'Programarea a fost actualizată cu succes.' : 'Programarea a fost creată cu succes.')
      },
      onError: () => {
        setServerError('A apărut o eroare. Te rugăm să încerci din nou.')
      },
    })
  }

  // Funcții helper — mesaje feedback
  const showSuccess = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  // ── Confirmare ștergere ────────────────────────────────────────────────────
  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteAppointment.mutate(deleteTarget.id, {
      onSuccess: () => { setDeleteTarget(null); showSuccess('Programarea a fost anulată cu succes.') },
      onError: () => { setDeleteTarget(null) },
    })
  }

  // Date transformate pentru export
  const buildExportData = useCallback(() =>
    appointments.map(a => ({
      patientName:   a.patientName,
      doctorName:    a.doctorName,
      specialtyName: a.specialtyName ?? '—',
      startTime:     formatDateTime(a.startTime),
      endTime:       formatTime(a.endTime),
      statusName:    a.statusName,
      notes:         a.notes ?? '—',
      createdAt:     a.createdAt ? formatDate(a.createdAt) : '—',
    }))
  , [appointments])

  // ── Export handler ──────────────────────────────────────────────────────────
  const handleExcelExport = useCallback(() => {
    gridRef.current?.exportExcel({
      fileName: 'programari',
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
      setSortDir(e.sort[0].direction ?? 'asc')
    } else {
      setSortBy('startTime')
      setSortDir('desc')
    }
    setPage(1)
  }, [])

  // ── Cell templates ─────────────────────────────────────────────────────────
  const patientTemplate = useCallback((row: AppointmentDto) => (
    <span className={styles.patientName}>{row.patientName}</span>
  ), [])

  const doctorTemplate = useCallback((row: AppointmentDto) => (
    <div>
      <span className={styles.doctorName}>{row.doctorName}</span>
      {row.specialtyName && (
        <div style={{ fontSize: '0.72rem', color: '#9EADB9', marginTop: 1 }}>{row.specialtyName}</div>
      )}
    </div>
  ), [])

  const dateTimeTemplate = useCallback((row: AppointmentDto) => (
    <div className={styles.timeCell}>
      <div>{new Date(row.startTime).toLocaleDateString('ro-RO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
      <div style={{ fontSize: '0.75rem', color: '#9EADB9' }}>
        {formatTime(row.startTime)} — {formatTime(row.endTime)}
      </div>
    </div>
  ), [])

  const statusTemplate = useCallback((row: AppointmentDto) => (
    <AppBadge variant={getStatusVariant(row.statusCode)} withDot>
      {row.statusName}
    </AppBadge>
  ), [])

  const notesTemplate = useCallback((row: AppointmentDto) =>
    row.notes
      ? <span className={styles.notesCell} title={row.notes}>{row.notes.length > 50 ? `${row.notes.substring(0, 50)}…` : row.notes}</span>
      : <span style={{ color: '#C9D3DC', fontSize: '0.78rem' }}>—</span>
  , [])

  const actionsTemplate = useCallback((row: AppointmentDto) => (
    <ActionButtons
      onView={() => handleOpenDetail(row)}
      onEdit={() => handleOpenEdit(row)}
      onDelete={() => setDeleteTarget(row)}
    />
  ), [])

  // ── Column definitions ─────────────────────────────────────────────────────
  const columnDefs = useMemo<ColDef<AppointmentDto>[]>(() => [
    { field: 'patientName', headerName: 'Pacient', flex: 2, minWidth: 150, cellRenderer: ({ data }) => data ? patientTemplate(data) : null },
    { field: 'patientPhone', headerName: 'Telefon pacient', width: 150, minWidth: 130, cellRenderer: ({ data }) => phoneCellTemplate(data as unknown as Record<string, unknown>) },
    { field: 'doctorName', headerName: 'Doctor', flex: 2, minWidth: 150, cellRenderer: ({ data }) => data ? doctorTemplate(data) : null },
    { field: 'startTime', headerName: 'Data / Ora', width: 160, minWidth: 140, cellRenderer: ({ data }) => data ? dateTimeTemplate(data) : null },
    { field: 'statusName', headerName: 'Status', width: 140, minWidth: 120, cellRenderer: ({ data }) => data ? statusTemplate(data) : null },
    { field: 'notes', headerName: 'Observații', flex: 1, minWidth: 120, cellRenderer: ({ data }) => data ? notesTemplate(data) : null },
    { field: 'createdAt', headerName: 'Creat', width: 120, minWidth: 100, hide: true, ellipsis: true, valueFormatter: ({ value }) => value ? formatDate(value as string) : '—' },
    {
      field: 'id', headerName: '', width: 100, minWidth: 100,
      sortable: false, filterable: false, reorderable: false, resizable: false,
      pinned: 'right',
      cellRenderer: ({ data }) => data ? actionsTemplate(data) : null,
    },
  ], [patientTemplate, doctorTemplate, dateTimeTemplate, statusTemplate, notesTemplate, actionsTemplate])

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
          <h1 className={styles.pageTitle}>Programări</h1>
          <p className={styles.pageSubtitle}>Gestionare programări pacienți, confirmare și anulare</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} onClick={() => navigate('/appointments/scheduler')}>
            <IconScheduler /> Scheduler
          </button>
          <button className={styles.btnSecondary} onClick={handleExcelExport}>
            <IconExcel /> Export Excel
          </button>
          <button className={styles.btnPrimary} onClick={handleOpenCreate}>
            <IconPlus /> Programare nouă
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--blue']}`}><IconCalendar /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.totalAppointments ?? totalCount}</span>
            <span className={styles.statLabel}>Total programări</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--blue']}`}><IconClock /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.scheduledCount ?? 0}</span>
            <span className={styles.statLabel}>Programate</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--green']}`}><IconCheck /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.confirmedCount ?? 0}</span>
            <span className={styles.statLabel}>Confirmate</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--green']}`}><IconCheck /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.completedCount ?? 0}</span>
            <span className={styles.statLabel}>Finalizate</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--red']}`}><IconX /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.cancelledCount ?? 0}</span>
            <span className={styles.statLabel}>Anulate</span>
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
            placeholder="Caută după pacient, doctor, observații..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
          />
        </div>

        <div className={styles.filterGroup}>
          <span className={styles.filterLabel}>Doctor:</span>
          <select
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

        <FormDatePicker<{ dateFrom: string; dateTo: string }>
          name="dateFrom"
          control={filterDateControl}
          label="De la"
          className={styles.filterDatePicker}
          showClearButton
          showTodayButton={false}
          onValueChange={(date) => {
            setDateFrom(date ? date.toISOString().slice(0, 10) : undefined)
            setPage(1)
          }}
        />

        <FormDatePicker<{ dateFrom: string; dateTo: string }>
          name="dateTo"
          control={filterDateControl}
          label="Până la"
          className={styles.filterDatePicker}
          showClearButton
          showTodayButton={false}
          onValueChange={(date) => {
            setDateTo(date ? date.toISOString().slice(0, 10) : undefined)
            setPage(1)
          }}
        />

        <div className={styles.toolbarDivider} />

        <div className={styles.statusPills}>
          {(['all', 'scheduled', 'confirmed', 'completed', 'cancelled'] as AppointmentStatusFilter[]).map(s => (
            <button
              key={s}
              className={`${styles.pill} ${statusFilter === s ? styles.active : ''}`}
              onClick={() => { setStatusFilter(s); setPage(1) }}
            >
              {{
                all: 'Toate',
                scheduled: 'Programate',
                confirmed: 'Confirmate',
                completed: 'Finalizate',
                cancelled: 'Anulate',
              }[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Grid — mod server-side: paginare + sortare + filtrare la API */}
      <div className={styles.gridWrapper}>
        <AppDataGrid<AppointmentDto>
          ref={gridRef}
          rowData={appointments}
          columnDefs={columnDefs}
          initialSort={[{ field: 'startTime', direction: 'desc' }]}
          loading={!appointmentsResp}
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
            { type: 'total-count' },
            { type: 'filtered-count' },
            { type: 'selected-count' },
          ]}
          // Aspect
          alternateRows
          enableHover
          gridLines="horizontal"
          stickyHeader
        />
      </div>

      {/* Mesaj succes */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show mt-3" role="alert">
          {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg(null)} />
        </div>
      )}

      {/* Modal creare/editare */}
      <AppointmentFormModal
        isOpen={formModalOpen}
        onClose={() => { setFormModalOpen(false); setEditingAppointment(null); setServerError(null) }}
        onSubmit={handleFormSubmit}
        isLoading={createAppointment.isPending || updateAppointment.isPending}
        editData={editingAppointment}
        patientLookup={patientLookup}
        doctorLookup={doctorLookup}
        serverError={serverError}
      />

      {/* Modal detalii vizualizare */}
      <AppointmentDetailModal
        isOpen={!!detailAppointmentId}
        onClose={() => setDetailAppointmentId(null)}
        appointmentId={detailAppointmentId}
        onEdit={handleEditFromDetail}
      />

      {/* Dialog confirmare ștergere */}
      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h6 className={styles.confirmTitle}>Confirmare anulare</h6>
            <p className={styles.confirmText}>
              Sigur dorești să anulezi programarea pacientului <strong>{deleteTarget.patientName}</strong> din {formatDateTime(deleteTarget.startTime)}?
            </p>
            <div className={styles.confirmActions}>
              <AppButton variant="outline-secondary" size="sm" onClick={() => setDeleteTarget(null)}>
                Renunță
              </AppButton>
              <AppButton
                variant="danger"
                size="sm"
                isLoading={deleteAppointment.isPending}
                onClick={handleConfirmDelete}
              >
                Anulează programarea
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AppointmentsListPage
