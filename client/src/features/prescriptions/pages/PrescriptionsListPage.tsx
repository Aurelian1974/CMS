import { useCallback, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { AppDataGrid } from '@/components/data-display/AppDataGrid'
import type { ColDef, GridApi, PaginationChangedEvent, SortChangedEvent } from '@/components/data-display/AppDataGrid'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge } from '@/components/ui/AppBadge'
import { IconExcel, IconPlus } from '@/components/ui/Icons'
import { ConfirmDeleteDialog } from '@/components/ui/ConfirmDeleteDialog'
import { FeedbackAlerts } from '@/components/ui/FeedbackAlerts'
import { ListPageToolbar } from '@/components/ui/ListPageToolbar'
import { useFeedback } from '@/hooks/useFeedback'
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { prescriptionsApi } from '@/api/endpoints/prescriptions.api'
import { formatDate } from '@/utils/format'
import {
  prescriptionKeys,
  useDeletePrescription,
  usePrescriptionLookups,
  usePrescriptions,
} from '../hooks/usePrescriptions'
import {
  PRESCRIPTION_STATUS,
  type PrescriptionDetailDto,
  type PrescriptionKindFilter,
  type PrescriptionListDto,
} from '../types/prescription.types'
import { formatSeriesNumber, statusBadgeVariant } from '../utils/prescriptionFormat'
import { PrescriptionPreviewModal } from '../components/PrescriptionPreviewModal'
import { PrescriptionFormModal } from '../components/PrescriptionFormModal'
import styles from './PrescriptionsListPage.module.scss'

const IconRx      = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg>
const IconShield  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const IconPen     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>
const IconCal     = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>

const DEFAULT_SORT_FIELD = 'issueDate'

// Câmpurile grid-ului → valorile @SortBy acceptate de Prescription_GetPaged
const SORT_FIELD_MAP: Record<string, string> = {
  issueDate:   'Date',
  number:      'Number',
  patientName: 'PatientName',
  doctorName:  'DoctorName',
  validUntil:  'ValidUntil',
  typeName:    'TypeName',
  statusName:  'StatusName',
}

export const PrescriptionsListPage = () => {
  const gridRef = useRef<GridApi<PrescriptionListDto>>(null)
  const qc = useQueryClient()
  const { canWrite } = useHasAccess()
  const canModify = canWrite(MODULE.Prescriptions)

  const [search, setSearch] = useState('')
  const [kind, setKind] = useState<PrescriptionKindFilter>('all')
  const [statusId, setStatusId] = useState<string | undefined>(undefined)
  const [doctorId, setDoctorId] = useState<string | undefined>(undefined)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState(SORT_FIELD_MAP[DEFAULT_SORT_FIELD])
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const [previewId, setPreviewId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<PrescriptionDetailDto | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PrescriptionListDto | null>(null)

  const { successMsg, errorMsg, showSuccess, showError, setSuccessMsg, setErrorMsg } = useFeedback()

  const { data: lookupsResp } = usePrescriptionLookups()
  const { data: doctorsResp } = useDoctorLookup()
  const lookups = lookupsResp?.data
  const doctors = doctorsResp?.data ?? []

  // Filtrul rapid compensat / simplu se traduce în Id-ul tipului din nomenclator
  const prescriptionTypeId = useMemo(() => {
    if (kind === 'all') return undefined
    return lookups?.types.find((t) => t.isCnas === (kind === 'compensated'))?.id
  }, [kind, lookups])

  const { data: resp, isError } = usePrescriptions({
    search: search || undefined,
    prescriptionTypeId,
    statusId,
    doctorId,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize,
    sortBy,
    sortDir,
  })

  const deleteMut = useDeletePrescription()

  const rows = useMemo(() => resp?.data?.pagedResult?.items ?? [], [resp])
  const totalCount = resp?.data?.pagedResult?.totalCount ?? 0
  const stats = resp?.data?.stats

  const resetPage = () => setPage(1)

  // ── Acțiuni ────────────────────────────────────────────────────────────────
  const handleOpenCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const handleOpenEdit = useCallback(async (id: string) => {
    try {
      const detail = await qc.fetchQuery({
        queryKey: prescriptionKeys.detail(id),
        queryFn: () => prescriptionsApi.getById(id),
      })
      if (detail.data) {
        setEditing(detail.data)
        setFormOpen(true)
      }
    } catch (err) {
      showError(err)
    }
  }, [qc, showError])

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteMut.mutate(deleteTarget.id, {
      onSuccess: () => { setDeleteTarget(null); showSuccess('Ciorna rețetei a fost ștearsă.') },
      onError: (err) => { setDeleteTarget(null); showError(err) },
    })
  }

  const handleExcelExport = useCallback(() => {
    gridRef.current?.exportExcel({
      fileName: 'retete',
      customData: rows.map((r) => ({
        number:       formatSeriesNumber(r.series, r.number),
        issueDate:    r.issueDate ? formatDate(r.issueDate) : '—',
        typeName:     r.typeName,
        patientName:  r.patientName,
        patientCnp:   r.patientCnp ?? '—',
        doctorName:   r.doctorName,
        diagnostic:   [r.diagnosticCodes, r.diagnostic].filter(Boolean).join(' — ') || '—',
        itemCount:    r.itemCount,
        careTypeName: r.careTypeName ?? '—',
        validUntil:   r.validUntil ? formatDate(r.validUntil) : '—',
        statusName:   r.statusName,
      })),
    })
  }, [rows])

  // ── Grid server-side ───────────────────────────────────────────────────────
  const handlePaginationChanged = useCallback((e: PaginationChangedEvent) => {
    setPage(e.page)
    setPageSize(e.pageSize)
  }, [])

  const handleSortChanged = useCallback((e: SortChangedEvent) => {
    const first = e.sort[0]
    setSortBy(SORT_FIELD_MAP[first?.field ?? DEFAULT_SORT_FIELD] ?? SORT_FIELD_MAP[DEFAULT_SORT_FIELD])
    setSortDir(first?.direction ?? 'desc')
    setPage(1)
  }, [])

  // ── Coloane ────────────────────────────────────────────────────────────────
  const columnDefs = useMemo<ColDef<PrescriptionListDto>[]>(() => [
    {
      field: 'number', headerName: 'Serie / Nr.', width: 120, minWidth: 100,
      cellRenderer: ({ data }) => data
        ? (data.number == null
            ? <span className={styles.draft}>Ciornă</span>
            : <span className={styles.number}>{formatSeriesNumber(data.series, data.number)}</span>)
        : null,
    },
    {
      field: 'issueDate', headerName: 'Data', width: 115, minWidth: 100,
      valueFormatter: ({ data }) => {
        const row = data as PrescriptionListDto | undefined
        return row ? formatDate(row.issueDate ?? row.createdAt) : ''
      },
    },
    {
      field: 'typeName', headerName: 'Tip', width: 130, minWidth: 110,
      cellRenderer: ({ data }) => data
        ? <AppBadge variant={data.isCnas ? 'primary' : 'neutral'}>{data.isCnas ? 'Compensată' : 'Simplă'}</AppBadge>
        : null,
    },
    {
      field: 'patientName', headerName: 'Pacient', flex: 2, minWidth: 170,
      cellRenderer: ({ data }) => data ? (
        <div>
          <div className={styles.patientName}>{data.patientName}</div>
          {data.patientCnp && <div className={styles.patientMeta}>CNP {data.patientCnp}</div>}
        </div>
      ) : null,
    },
    { field: 'doctorName', headerName: 'Medic', flex: 1, minWidth: 140, ellipsis: true },
    {
      field: 'diagnostic', headerName: 'Diagnostic', flex: 2, minWidth: 180, sortable: false, ellipsis: true,
      valueFormatter: ({ data }) => {
        const row = data as PrescriptionListDto | undefined
        return row ? [row.diagnosticCodes, row.diagnostic].filter(Boolean).join(' — ') || '—' : ''
      },
    },
    {
      field: 'itemCount', headerName: 'Medicamente', width: 120, minWidth: 100, sortable: false,
      cellRenderer: ({ data }) => data
        ? <span>{data.itemCount}{data.nhpCode ? <AppBadge variant="purple" className="ms-1">PNS {data.nhpCode}</AppBadge> : null}</span>
        : null,
    },
    { field: 'careTypeName', headerName: 'Tip afecțiune', width: 150, minWidth: 120, sortable: false, hide: true, ellipsis: true },
    {
      field: 'validUntil', headerName: 'Valabilă până', width: 125, minWidth: 110,
      cellRenderer: ({ data }) => data
        ? (data.validUntil
            ? <span className={data.isExpired ? styles.expired : undefined}>{formatDate(data.validUntil)}</span>
            : <span className={styles.muted}>—</span>)
        : null,
    },
    { field: 'electronicId', headerName: 'ID SIPE', width: 130, minWidth: 110, sortable: false, hide: true, ellipsis: true },
    {
      field: 'statusName', headerName: 'Status', width: 125, minWidth: 110,
      cellRenderer: ({ data }) => data
        ? <AppBadge variant={statusBadgeVariant(data.statusCode)} withDot>{data.isExpired ? 'Expirată' : data.statusName}</AppBadge>
        : null,
    },
    {
      field: 'id', headerName: '', width: 130, minWidth: 130,
      sortable: false, filterable: false, reorderable: false, resizable: false,
      pinned: 'right',
      cellRenderer: ({ data }) => {
        if (!data) return null
        const isDraft = canModify && data.statusCode === PRESCRIPTION_STATUS.Draft
        return (
          <ActionButtons
            onView={() => setPreviewId(data.id)}
            onEdit={isDraft ? () => { void handleOpenEdit(data.id) } : undefined}
            onDelete={isDraft ? () => setDeleteTarget(data) : undefined}
          />
        )
      },
    },
  ], [canModify, handleOpenEdit])

  if (isError) {
    return (
      <div className={styles.page}>
        <div className="alert alert-danger m-4">Nu s-au putut încărca rețetele. Verifică conexiunea la server.</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Prescripții"
        subtitle="Rețete compensate CNAS și rețete simple (necompensate)"
        actions={
          <>
            <button className={styles.btnSecondary} onClick={handleExcelExport}>
              <IconExcel /> Export Excel
            </button>
            {canModify && (
              <button className={styles.btnPrimary} onClick={handleOpenCreate}>
                <IconPlus /> Rețetă nouă
              </button>
            )}
          </>
        }
      />

      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--blue']}`}><IconRx /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.totalPrescriptions ?? 0}</span>
            <span className={styles.statLabel}>Total rețete</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--green']}`}><IconShield /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.compensatedCount ?? 0}</span>
            <span className={styles.statLabel}>Compensate</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--purple']}`}><IconRx /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.simpleCount ?? 0}</span>
            <span className={styles.statLabel}>Simple</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--orange']}`}><IconPen /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.draftCount ?? 0}</span>
            <span className={styles.statLabel}>Ciorne</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--gray']}`}><IconCal /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.issuedThisMonth ?? 0}</span>
            <span className={styles.statLabel}>Emise luna aceasta</span>
          </div>
        </div>
      </div>

      <ListPageToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); resetPage() }}
        searchPlaceholder="Caută după pacient, CNP, serie / număr, diagnostic..."
        statusFilter={kind}
        onStatusChange={(k) => { setKind(k); resetPage() }}
        statusOptions={[
          { value: 'all' as PrescriptionKindFilter, label: 'Toate' },
          { value: 'compensated' as PrescriptionKindFilter, label: 'Compensate' },
          { value: 'simple' as PrescriptionKindFilter, label: 'Simple' },
        ]}
        filters={
          <>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Status:</span>
              <select className={styles.filterSelect} value={statusId ?? ''}
                onChange={(e) => { setStatusId(e.target.value || undefined); resetPage() }}>
                <option value="">Toate</option>
                {(lookups?.statuses ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Medic:</span>
              <select className={styles.filterSelect} value={doctorId ?? ''}
                onChange={(e) => { setDoctorId(e.target.value || undefined); resetPage() }}>
                <option value="">Toți</option>
                {doctors.map((d) => <option key={d.id} value={d.id}>{d.fullName}</option>)}
              </select>
            </div>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>Perioadă:</span>
              <input type="date" className={styles.filterDate} value={dateFrom} aria-label="De la"
                onChange={(e) => { setDateFrom(e.target.value); resetPage() }} />
              <input type="date" className={styles.filterDate} value={dateTo} aria-label="Până la"
                onChange={(e) => { setDateTo(e.target.value); resetPage() }} />
            </div>
          </>
        }
      />

      <div className={styles.gridWrapper}>
        <AppDataGrid<PrescriptionListDto>
          ref={gridRef}
          rowData={rows}
          columnDefs={columnDefs}
          initialSort={[{ field: DEFAULT_SORT_FIELD, direction: 'desc' }]}
          loading={!resp}
          getRowId={(row) => row.id}
          pagination
          pageSize={pageSize}
          pageSizes={[10, 20, 50, 100]}
          showPager
          serverSideCount={totalCount}
          onPaginationChanged={handlePaginationChanged}
          onSortChanged={handleSortChanged}
          triStateSort
          toolbar
          contextMenu
          statusBar={[{ type: 'total-count' }]}
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
      />

      <PrescriptionPreviewModal
        prescriptionId={previewId}
        onClose={() => setPreviewId(null)}
        onEdit={(detail) => { setPreviewId(null); setEditing(detail); setFormOpen(true) }}
        onChanged={(action) => {
          if (action === 'issued') showSuccess('Rețeta a fost emisă.')
          if (action === 'cancelled') showSuccess('Rețeta a fost anulată.')
          if (action === 'deleted') showSuccess('Ciorna rețetei a fost ștearsă.')
          if (action === 'transmitted') showSuccess('Rețeta a fost transmisă în SIPE.')
        }}
      />

      <PrescriptionFormModal
        isOpen={formOpen}
        editData={editing}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSaved={showSuccess}
      />

      <ConfirmDeleteDialog
        name={deleteTarget ? `ciorna rețetei pentru ${deleteTarget.patientName}` : null}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isLoading={deleteMut.isPending}
      />
    </div>
  )
}

export default PrescriptionsListPage
