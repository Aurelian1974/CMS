import { useState, useRef, useCallback, useMemo } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { AppDataGrid } from '@/components/data-display/AppDataGrid'
import type { ColDef, GridApi, PaginationChangedEvent, SortChangedEvent } from '@/components/data-display/AppDataGrid'
import type { AppointmentDto, CreateAppointmentPayload, UpdateAppointmentPayload } from '../types/appointment.types'
import { useAppointments, useAppointmentStatuses, useDeleteAppointment, useCreateAppointment, useUpdateAppointment } from '../hooks/useAppointments'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { usePatientLookup } from '@/features/patients/hooks/usePatients'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge, type BadgeVariant } from '@/components/ui/AppBadge'
import { FormDatePicker } from '@/components/forms/FormDatePicker'
import { formatDate, toLocalDateISO } from '@/utils/format'
import { phoneCellTemplate } from '@/components/data-display/PhoneCell'
import { useFeedback } from '@/hooks/useFeedback'
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { FeedbackAlerts } from '@/components/ui/FeedbackAlerts'
import { ListPageToolbar } from '@/components/ui/ListPageToolbar'
import { AppointmentFormModal } from '../components/AppointmentFormModal/AppointmentFormModal'
import { AppointmentDetailModal } from '../components/AppointmentDetailModal/AppointmentDetailModal'
import { IconPlus, IconExcel } from '@/components/ui/Icons'
import { appointmentsApi } from '@/api/endpoints/appointments.api'
import styles from './AppointmentsListPage.module.scss'

// \u2500\u2500 Icoane specifice paginii \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
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

const ALL_STATUSES = 'all'
/** Plafonul exportului = pageSize maxim acceptat de API (GetAppointmentsQueryValidator) */
const EXPORT_MAX_ROWS = 200

// ── Componenta principală ─────────────────────────────────────────────────────
export const AppointmentsListPage = () => {
  const navigate = useNavigate()
  const gridRef = useRef<GridApi<AppointmentDto>>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>(ALL_STATUSES)
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
  const { successMsg, errorMsg, showSuccess, showError, setSuccessMsg, setErrorMsg } = useFeedback()

  // Drepturi: Write = creare/editare/status, Full = ștergere definitivă
  const { canWrite, hasFull } = useHasAccess()
  const canEdit = canWrite(MODULE.Appointments)
  const canDelete = hasFull(MODULE.Appointments)

  // Mini form pentru filtrele de dată (necesar pentru FormDatePicker)
  const { control: filterDateControl } = useForm<{ dateFrom: string; dateTo: string }>({
    defaultValues: { dateFrom: '', dateTo: '' },
  })

  // Date reale din API — paginare + sortare + filtrare complet server-side
  const { data: appointmentsResp, isError, isLoading, isFetching, error } = useAppointments({
    page,
    pageSize,
    search:   search || undefined,
    doctorId,
    statusId: statusFilter === ALL_STATUSES ? undefined : statusFilter,
    dateFrom,
    dateTo,
    sortBy,
    sortDir,
  })

  // Date auxiliare
  const { data: doctorLookupResp } = useDoctorLookup()
  const { data: patientLookupResp } = usePatientLookup()
  const { data: statusesResp } = useAppointmentStatuses()

  // Mutații
  const deleteAppointment = useDeleteAppointment()
  const createAppointment = useCreateAppointment()
  const updateAppointment = useUpdateAppointment()

  const appointments = useMemo(() => appointmentsResp?.data?.pagedResult?.items ?? [], [appointmentsResp])
  const totalCount   = appointmentsResp?.data?.pagedResult?.totalCount ?? 0
  const stats        = appointmentsResp?.data?.stats

  const doctorLookup = doctorLookupResp?.data ?? []
  const patientLookup = patientLookupResp?.data ?? []
  const statuses = useMemo(() => statusesResp?.data ?? [], [statusesResp])
  const statusOptions = useMemo(() => [
    { value: ALL_STATUSES, label: 'Toate' },
    ...statuses.map(s => ({ value: s.id, label: s.name })),
  ], [statuses])

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
      onError: (err: Error) => {
        setServerError(err.message)
      },
    })
  }

  // ── Confirmare ștergere ────────────────────────────────────────────────────
  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteAppointment.mutate(deleteTarget.id, {
      onSuccess: () => { setDeleteTarget(null); showSuccess('Programarea a fost ștearsă.') },
      onError: (err: Error) => { setDeleteTarget(null); showError(err) },
    })
  }

  // Export pe tot setul filtrat (nu doar pagina curentă), plafonat la EXPORT_MAX_ROWS
  const [isExporting, setIsExporting] = useState(false)
  const handleExcelExport = useCallback(async () => {
    setIsExporting(true)
    try {
      const resp = await appointmentsApi.getAll({
        page: 1,
        pageSize: EXPORT_MAX_ROWS,
        search:   search || undefined,
        doctorId,
        statusId: statusFilter === ALL_STATUSES ? undefined : statusFilter,
        dateFrom,
        dateTo,
        sortBy,
        sortDir,
      })
      const rows = resp.data?.pagedResult?.items ?? []
      gridRef.current?.exportExcel({
        fileName: 'programari',
        customData: rows.map(a => ({
          patientName:   a.patientName,
          doctorName:    a.doctorName,
          specialtyName: a.specialtyName ?? '—',
          startTime:     formatDateTime(a.startTime),
          endTime:       formatTime(a.endTime),
          statusName:    a.statusName,
          notes:         a.notes ?? '—',
          createdAt:     a.createdAt ? formatDate(a.createdAt) : '—',
        })),
      })
      const total = resp.data?.pagedResult?.totalCount ?? 0
      if (total > rows.length) {
        showSuccess(`Exportul conține primele ${rows.length} din ${total} programări. Restrânge filtrele pentru un export complet.`)
      }
    } catch (err) {
      showError(err)
    } finally {
      setIsExporting(false)
    }
  }, [search, doctorId, statusFilter, dateFrom, dateTo, sortBy, sortDir, showSuccess, showError])

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
      onEdit={canEdit ? () => handleOpenEdit(row) : undefined}
      onDelete={canDelete ? () => setDeleteTarget(row) : undefined}
    />
  ), [canEdit, canDelete])

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
          {error instanceof Error ? error.message : 'Nu s-au putut încărca datele. Verifică conexiunea la server.'}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>

      {/* Header */}
      <PageHeader
        title="Programări"
        subtitle="Gestionare programări pacienți, confirmare și anulare"
        actions={
          <>
            <button className={styles.btnSecondary} onClick={() => navigate('/appointments/scheduler')}>
              <IconScheduler /> Scheduler
            </button>
            <button className={styles.btnSecondary} onClick={handleExcelExport} disabled={isExporting}>
              <IconExcel /> Export Excel
            </button>
            {canEdit && (
              <button className={styles.btnPrimary} onClick={handleOpenCreate}>
                <IconPlus /> Programare nouă
              </button>
            )}
          </>
        }
      />

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
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--orange']}`}><IconX /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.noShowCount ?? 0}</span>
            <span className={styles.statLabel}>Neprezentări</span>
          </div>
        </div>
      </div>

      {/* Toolbar filtrare */}
      <ListPageToolbar
        search={search}
        onSearchChange={v => { setSearch(v); setPage(1) }}
        searchPlaceholder="Caută după pacient, doctor, observații..."
        statusFilter={statusFilter}
        onStatusChange={s => { setStatusFilter(s); setPage(1) }}
        statusOptions={statusOptions}
        filters={
          <>
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
                setDateFrom(date ? toLocalDateISO(date) : undefined)
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
                setDateTo(date ? toLocalDateISO(date) : undefined)
                setPage(1)
              }}
            />
          </>
        }
      />

      {/* Grid — mod server-side: paginare + sortare + filtrare la API */}
      <div className={styles.gridWrapper}>
        <AppDataGrid<AppointmentDto>
          ref={gridRef}
          rowData={appointments}
          columnDefs={columnDefs}
          initialSort={[{ field: 'startTime', direction: 'desc' }]}
          loading={isLoading || isFetching}
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
          // Fără filtrare/grupare pe coloane: paginarea e server-side, ar opera doar pe pagina curentă
          // Toolbar & Context Menu
          toolbar
          contextMenu
          // Status Bar
          statusBar={[
            { type: 'total-count' },
          ]}
          // Aspect
          alternateRows
          enableHover
          gridLines="horizontal"
          stickyHeader
        />
      </div>

      <FeedbackAlerts
        successMsg={successMsg}
        errorMsg={errorMsg}
        onDismissSuccess={() => setSuccessMsg(null)}
        onDismissError={() => setErrorMsg(null)}
        errorClass="mt-3"
      />

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
        canOverrideSchedule={canDelete}
      />

      {/* Modal detalii vizualizare */}
      <AppointmentDetailModal
        isOpen={!!detailAppointmentId}
        onClose={() => setDetailAppointmentId(null)}
        appointmentId={detailAppointmentId}
        onEdit={canEdit ? handleEditFromDetail : undefined}
        canWrite={canEdit}
        onStatusChanged={showSuccess}
      />

      <ConfirmDeleteDialog
        name={deleteTarget?.patientName}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteAppointment.isPending}
        title="Confirmare ștergere"
        message={
          deleteTarget ? (
            <>Programarea pacientului <strong>{deleteTarget.patientName}</strong> din {formatDateTime(deleteTarget.startTime)} va fi ștearsă definitiv. Pentru anulare folosește acțiunea <strong>Anulează</strong> din detaliile programării.</>
          ) : null
        }
        confirmLabel="Șterge definitiv"
        cancelLabel="Renunță"
      />
    </div>
  )
}

export default AppointmentsListPage
