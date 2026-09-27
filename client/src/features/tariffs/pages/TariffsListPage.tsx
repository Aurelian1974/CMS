import { useCallback, useMemo, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/components/layout/PageHeader'
import { AppDataGrid } from '@/components/data-display/AppDataGrid'
import type { ColDef, GridApi, PaginationChangedEvent, SortChangedEvent } from '@/components/data-display/AppDataGrid'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge } from '@/components/ui/AppBadge'
import { IconExcel, IconPlus } from '@/components/ui/Icons'
import { FeedbackAlerts } from '@/components/ui/FeedbackAlerts'
import { ListPageToolbar } from '@/components/ui/ListPageToolbar'
import { useFeedback } from '@/hooks/useFeedback'
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import { tariffsApi } from '@/api/endpoints/tariffs.api'
import { formatCurrency, formatDate } from '@/utils/format'
import {
  tariffKeys,
  useBillingLookups,
  useCreateMedicalService,
  useMedicalServices,
  useSetMedicalServiceActive,
  useUpdateMedicalService,
} from '../hooks/useTariffs'
import type { MedicalServiceFormData } from '../schemas/tariff.schema'
import type { ActiveFilter, MedicalServiceDetailDto, MedicalServiceListDto } from '../types/tariff.types'
import { MedicalServiceFormModal } from '../components/MedicalServiceFormModal'
import { PriceHistoryModal } from '../components/PriceHistoryModal'
import { VatRatesModal } from '../components/VatRatesModal'
import styles from './TariffsListPage.module.scss'

const IconTag   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
const IconPause = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
const IconPower = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18.36 6.64a9 9 0 11-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>

const DEFAULT_SORT_FIELD = 'name'

// Câmpurile grid-ului → valorile @SortBy acceptate de MedicalService_GetPaged
const SORT_FIELD_MAP: Record<string, string> = {
  name:         'Name',
  code:         'Code',
  categoryName: 'Category',
  currentPrice: 'Price',
}

const ACTIVE_FILTER: Record<ActiveFilter, boolean | undefined> = {
  all: undefined,
  active: true,
  inactive: false,
}

export const TariffsListPage = () => {
  const gridRef = useRef<GridApi<MedicalServiceListDto>>(null)
  const qc = useQueryClient()
  const { canWrite, hasFull } = useHasAccess()
  const canModify = canWrite(MODULE.Tariffs)
  const canManageVat = hasFull(MODULE.Tariffs)

  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>('active')
  const [categoryId, setCategoryId] = useState<string | undefined>(undefined)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState(SORT_FIELD_MAP[DEFAULT_SORT_FIELD])
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<MedicalServiceDetailDto | null>(null)
  const [historyId, setHistoryId] = useState<string | null>(null)
  const [vatOpen, setVatOpen] = useState(false)

  const { successMsg, errorMsg, showSuccess, showError, setSuccessMsg, setErrorMsg } = useFeedback()

  const { data: lookupsResp } = useBillingLookups()
  const lookups = lookupsResp?.data ?? undefined

  const { data: resp, isError } = useMedicalServices({
    search: search || undefined,
    categoryId,
    isActive: ACTIVE_FILTER[activeFilter],
    page,
    pageSize,
    sortBy,
    sortDir,
  })

  const createMut = useCreateMedicalService()
  const updateMut = useUpdateMedicalService()
  const activeMut = useSetMedicalServiceActive()

  const rows = useMemo(() => resp?.data?.pagedResult?.items ?? [], [resp])
  const totalCount = resp?.data?.pagedResult?.totalCount ?? 0
  const stats = resp?.data?.stats

  const resetPage = () => setPage(1)

  // ── Acțiuni ────────────────────────────────────────────────────────────────
  const handleOpenEdit = useCallback(async (id: string) => {
    try {
      const detail = await qc.fetchQuery({ queryKey: tariffKeys.detail(id), queryFn: () => tariffsApi.getById(id) })
      if (detail.data) {
        setEditing(detail.data)
        setFormOpen(true)
      }
    } catch (err) {
      showError(err)
    }
  }, [qc, showError])

  const handleToggleActive = useCallback((row: MedicalServiceListDto) => {
    activeMut.mutate(
      { id: row.id!, isActive: !row.isActive },
      {
        onSuccess: () => showSuccess(row.isActive ? 'Serviciul a fost dezactivat.' : 'Serviciul a fost reactivat.'),
        onError: showError,
      },
    )
  }, [activeMut, showSuccess, showError])

  const handleSubmit = (data: MedicalServiceFormData) => {
    const durationMinutes = data.durationMinutes === '' ? null : data.durationMinutes
    const investigationTypeCode = data.investigationTypeCode || null
    const done = (msg: string) => ({
      onSuccess: () => { setFormOpen(false); setEditing(null); showSuccess(msg) },
      onError: showError,
    })

    if (editing) {
      updateMut.mutate({
        id: editing.id!,
        code: data.code,
        name: data.name,
        categoryId: data.categoryId,
        durationMinutes,
        investigationTypeCode,
        rowVersion: editing.rowVersion,
      }, done('Serviciul a fost actualizat.'))
    } else {
      createMut.mutate({
        code: data.code,
        name: data.name,
        categoryId: data.categoryId,
        durationMinutes,
        investigationTypeCode,
        price: data.price,
        vatRateId: data.vatRateId,
        validFrom: data.validFrom,
      }, done('Serviciul a fost adăugat în nomenclator.'))
    }
  }

  const handleExcelExport = useCallback(() => {
    gridRef.current?.exportExcel({
      fileName: 'tarife',
      customData: rows.map((r) => ({
        code:            r.code,
        name:            r.name,
        categoryName:    r.categoryName,
        currentPrice:    r.currentPrice != null ? formatCurrency(r.currentPrice) : '—',
        vat:             r.currentVatRateName ?? '—',
        nextPrice:       r.nextPrice != null && r.nextValidFrom
                           ? `${formatCurrency(r.nextPrice)} de la ${formatDate(r.nextValidFrom)}` : '—',
        durationMinutes: r.durationMinutes ?? '—',
        status:          r.isActive ? 'Activ' : 'Inactiv',
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
    setSortDir(first?.direction ?? 'asc')
    setPage(1)
  }, [])

  const columnDefs = useMemo<ColDef<MedicalServiceListDto>[]>(() => [
    {
      field: 'code', headerName: 'Cod', width: 140, minWidth: 110,
      cellRenderer: ({ data }) => data ? <span className={styles.code}>{data.code}</span> : null,
    },
    { field: 'name', headerName: 'Denumire', flex: 2, minWidth: 200, ellipsis: true },
    {
      field: 'categoryName', headerName: 'Categorie', width: 190, minWidth: 150,
      cellRenderer: ({ data }) => data ? <AppBadge variant="primary">{data.categoryName}</AppBadge> : null,
    },
    {
      field: 'currentPrice', headerName: 'Preț', width: 130, minWidth: 110,
      cellRenderer: ({ data }) => data
        ? (data.currentPrice != null
            ? <span className={styles.price}>{formatCurrency(data.currentPrice)}</span>
            : <span className={styles.warn}>fără preț în vigoare</span>)
        : null,
    },
    { field: 'currentVatRateName', headerName: 'Regim TVA', flex: 1, minWidth: 150, sortable: false, ellipsis: true },
    {
      field: 'nextPrice', headerName: 'Preț programat', width: 190, minWidth: 150, sortable: false,
      cellRenderer: ({ data }) => data
        ? (data.nextPrice != null && data.nextValidFrom
            ? <span>{formatCurrency(data.nextPrice)} <span className={styles.muted}>de la {formatDate(data.nextValidFrom)}</span></span>
            : <span className={styles.muted}>—</span>)
        : null,
    },
    {
      field: 'durationMinutes', headerName: 'Durată', width: 100, minWidth: 90, sortable: false,
      valueFormatter: ({ data }) => {
        const row = data as MedicalServiceListDto | undefined
        return row?.durationMinutes ? `${row.durationMinutes} min` : '—'
      },
    },
    {
      field: 'isActive', headerName: 'Status', width: 115, minWidth: 100, sortable: false,
      cellRenderer: ({ data }) => data
        ? <AppBadge variant={data.isActive ? 'success' : 'neutral'} withDot>{data.isActive ? 'Activ' : 'Inactiv'}</AppBadge>
        : null,
    },
    {
      field: 'id', headerName: '', width: 140, minWidth: 140,
      sortable: false, filterable: false, reorderable: false, resizable: false,
      pinned: 'right',
      cellRenderer: ({ data }) => {
        if (!data) return null
        return (
          <div className={styles.actions}>
            <ActionButtons
              onView={() => setHistoryId(data.id!)}
              onEdit={canModify ? () => { void handleOpenEdit(data.id!) } : undefined}
            />
            {canModify && (
              <button
                type="button"
                className={data.isActive ? styles.toggleOff : styles.toggleOn}
                title={data.isActive ? 'Dezactivează' : 'Reactivează'}
                onClick={() => handleToggleActive(data)}
              >
                <IconPower />
              </button>
            )}
          </div>
        )
      },
    },
  ], [canModify, handleOpenEdit, handleToggleActive])

  if (isError) {
    return (
      <div className={styles.page}>
        <div className="alert alert-danger m-4">Nu s-a putut încărca nomenclatorul de tarife. Verifică conexiunea la server.</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Tarife"
        subtitle="Nomenclatorul serviciilor medicale și prețurile versionate"
        actions={
          <>
            <button className={styles.btnSecondary} onClick={handleExcelExport}>
              <IconExcel /> Export Excel
            </button>
            {canManageVat && (
              <button className={styles.btnSecondary} onClick={() => setVatOpen(true)}>
                Regimuri TVA
              </button>
            )}
            {canModify && (
              <button className={styles.btnPrimary} onClick={() => { setEditing(null); setFormOpen(true) }}>
                <IconPlus /> Serviciu nou
              </button>
            )}
          </>
        }
      />

      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--blue']}`}><IconTag /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.totalCount ?? 0}</span>
            <span className={styles.statLabel}>Total servicii</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--green']}`}><IconCheck /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.activeCount ?? 0}</span>
            <span className={styles.statLabel}>Active</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--gray']}`}><IconPause /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.inactiveCount ?? 0}</span>
            <span className={styles.statLabel}>Inactive</span>
          </div>
        </div>
      </div>

      <ListPageToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); resetPage() }}
        searchPlaceholder="Caută după cod sau denumire..."
        statusFilter={activeFilter}
        onStatusChange={(v) => { setActiveFilter(v); resetPage() }}
        statusOptions={[
          { value: 'active' as ActiveFilter, label: 'Active' },
          { value: 'inactive' as ActiveFilter, label: 'Inactive' },
          { value: 'all' as ActiveFilter, label: 'Toate' },
        ]}
        filters={
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Categorie:</span>
            <select className={styles.filterSelect} value={categoryId ?? ''}
              onChange={(e) => { setCategoryId(e.target.value || undefined); resetPage() }}>
              <option value="">Toate</option>
              {(lookups?.serviceCategories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
        }
      />

      <div className={styles.gridWrapper}>
        <AppDataGrid<MedicalServiceListDto>
          ref={gridRef}
          rowData={rows}
          columnDefs={columnDefs}
          initialSort={[{ field: DEFAULT_SORT_FIELD, direction: 'asc' }]}
          loading={!resp}
          getRowId={(row) => row.id!}
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

      <MedicalServiceFormModal
        isOpen={formOpen}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSubmit={handleSubmit}
        isLoading={createMut.isPending || updateMut.isPending}
        lookups={lookups}
        editData={editing}
      />

      <PriceHistoryModal
        serviceId={historyId}
        onClose={() => setHistoryId(null)}
        lookups={lookups}
        canEdit={canModify}
        onSaved={() => showSuccess('Prețul a fost salvat.')}
        onError={showError}
      />

      {canManageVat && (
        <VatRatesModal
          isOpen={vatOpen}
          onClose={() => setVatOpen(false)}
          onSaved={showSuccess}
          onError={showError}
        />
      )}
    </div>
  )
}

export default TariffsListPage
