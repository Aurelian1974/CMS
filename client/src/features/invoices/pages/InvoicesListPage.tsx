import { useCallback, useMemo, useRef, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AppDataGrid } from '@/components/data-display/AppDataGrid'
import type { ColDef, GridApi, PaginationChangedEvent, SortChangedEvent } from '@/components/data-display/AppDataGrid'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge } from '@/components/ui/AppBadge'
import { IconExcel } from '@/components/ui/Icons'
import { ListPageToolbar } from '@/components/ui/ListPageToolbar'
import { MODULE, useHasAccess } from '@/hooks/useHasAccess'
import { formatCurrency, formatDate } from '@/utils/format'
import { formatInvoiceNumber, invoiceStatusVariant } from '@/features/billing/constants/billing.constants'
import { useInvoices } from '../hooks/useInvoices'
import type { InvoiceListDto, InvoiceStatusFilter } from '../types/invoice.types'
import { InvoiceDetailModal } from '../components/InvoiceDetailModal'
import styles from './InvoicesListPage.module.scss'

const IconDoc    = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
const IconUndo   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
const IconMoney  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>

// Seed 0055 — InvoiceStatuses
const STATUS_IDS: Record<Exclude<InvoiceStatusFilter, 'all'>, string> = {
  issued:   'f4000000-0000-0000-0000-000000000001',
  reversed: 'f4000000-0000-0000-0000-000000000002',
}

const DEFAULT_SORT_FIELD = 'issueDate'

// Câmpurile grid-ului → valorile @SortBy acceptate de Invoice_GetPaged
const SORT_FIELD_MAP: Record<string, string> = {
  issueDate:    'IssueDate',
  customerName: 'CustomerName',
  total:        'Total',
}

export const InvoicesListPage = () => {
  const gridRef = useRef<GridApi<InvoiceListDto>>(null)
  const { hasFull } = useHasAccess()
  const canStorno = hasFull(MODULE.Invoices)

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<InvoiceStatusFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [sortBy, setSortBy] = useState(SORT_FIELD_MAP[DEFAULT_SORT_FIELD])
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [openId, setOpenId] = useState<string | null>(null)

  const { data: resp, isError } = useInvoices({
    search: search || undefined,
    statusId: statusFilter === 'all' ? undefined : STATUS_IDS[statusFilter],
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize,
    sortBy,
    sortDir,
  })

  const rows = useMemo(() => resp?.data?.pagedResult?.items ?? [], [resp])
  const totalCount = resp?.data?.pagedResult?.totalCount ?? 0
  const stats = resp?.data?.stats

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

  const handleExcelExport = useCallback(() => {
    gridRef.current?.exportExcel({
      fileName: 'facturi',
      customData: rows.map((r) => ({
        number:       formatInvoiceNumber(r.series, r.number),
        issueDate:    formatDate(r.issueDate),
        customerName: r.customerName,
        fiscalCode:   r.customerFiscalCode ?? '',
        totalNet:     r.totalNet,
        totalVat:     r.totalVat,
        total:        r.total,
        status:       r.isStorno ? `${r.statusName} (storno)` : r.statusName,
      })),
    })
  }, [rows])

  const columnDefs = useMemo<ColDef<InvoiceListDto>[]>(() => [
    { field: 'number', headerName: 'Număr', width: 140, minWidth: 120, sortable: false,
      cellRenderer: ({ data }) => data ? <span className={styles.strong}>{formatInvoiceNumber(data.series, data.number)}</span> : null },
    { field: 'issueDate', headerName: 'Data', width: 120, minWidth: 110,
      valueFormatter: ({ data }) => (data ? formatDate((data as InvoiceListDto).issueDate) : '') },
    { field: 'customerName', headerName: 'Client', flex: 2, minWidth: 200, ellipsis: true },
    { field: 'customerFiscalCode', headerName: 'CUI', width: 130, minWidth: 110, sortable: false,
      valueFormatter: ({ data }) => (data as InvoiceListDto | undefined)?.customerFiscalCode ?? '—' },
    { field: 'totalNet', headerName: 'Fără TVA', width: 130, minWidth: 110, sortable: false,
      valueFormatter: ({ data }) => (data ? formatCurrency((data as InvoiceListDto).totalNet) : '') },
    { field: 'totalVat', headerName: 'TVA', width: 110, minWidth: 90, sortable: false,
      valueFormatter: ({ data }) => (data ? formatCurrency((data as InvoiceListDto).totalVat) : '') },
    { field: 'total', headerName: 'Total', width: 130, minWidth: 110,
      cellRenderer: ({ data }) => data
        ? <span className={data.total < 0 ? styles.negative : styles.amount}>{formatCurrency(data.total)}</span>
        : null },
    { field: 'statusName', headerName: 'Status', width: 170, minWidth: 140, sortable: false,
      cellRenderer: ({ data }) => data ? (
        <span className={styles.badges}>
          <AppBadge variant={invoiceStatusVariant(data.statusCode)} withDot>{data.statusName}</AppBadge>
          {data.isStorno && <AppBadge variant="warning">Storno</AppBadge>}
        </span>
      ) : null },
    {
      field: 'id', headerName: '', width: 70, minWidth: 70,
      sortable: false, filterable: false, reorderable: false, resizable: false, pinned: 'right',
      cellRenderer: ({ data }) => data
        ? <div className={styles.actions}><ActionButtons onView={() => setOpenId(data.id)} /></div>
        : null,
    },
  ], [])

  if (isError) {
    return (
      <div className={styles.page}>
        <div className="alert alert-danger m-4">Nu s-a putut încărca lista de facturi. Verifică conexiunea la server.</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Facturi"
        subtitle="Facturile emise din consultații — PDF, stornare"
        actions={
          <button className={styles.btnSecondary} onClick={handleExcelExport}>
            <IconExcel /> Export Excel
          </button>
        }
      />

      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--blue']}`}><IconDoc /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.totalCount ?? 0}</span>
            <span className={styles.statLabel}>Facturi</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--orange']}`}><IconUndo /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.stornoCount ?? 0}</span>
            <span className={styles.statLabel}>Storno</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--green']}`}><IconMoney /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{formatCurrency(stats?.netTotalValue ?? 0)}</span>
            <span className={styles.statLabel}>Valoare netă (după storno)</span>
          </div>
        </div>
      </div>

      <ListPageToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Caută după număr, client sau CUI..."
        statusFilter={statusFilter}
        onStatusChange={(v) => { setStatusFilter(v); setPage(1) }}
        statusOptions={[
          { value: 'all' as InvoiceStatusFilter, label: 'Toate' },
          { value: 'issued' as InvoiceStatusFilter, label: 'Emise' },
          { value: 'reversed' as InvoiceStatusFilter, label: 'Stornate' },
        ]}
        filters={
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>De la:</span>
            <input type="date" className={styles.filterDate} value={dateFrom} aria-label="De la data"
              onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} />
            <span className={styles.filterLabel}>Până la:</span>
            <input type="date" className={styles.filterDate} value={dateTo} aria-label="Până la data"
              onChange={(e) => { setDateTo(e.target.value); setPage(1) }} />
          </div>
        }
      />

      <div className={styles.gridWrapper}>
        <AppDataGrid<InvoiceListDto>
          ref={gridRef}
          rowData={rows}
          columnDefs={columnDefs}
          initialSort={[{ field: DEFAULT_SORT_FIELD, direction: 'desc' }]}
          loading={!resp}
          getRowId={(row) => row.id}
          onRowDoubleClick={(e) => setOpenId(e.data.id)}
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

      <InvoiceDetailModal
        invoiceId={openId}
        canStorno={canStorno}
        onClose={() => setOpenId(null)}
        onNavigate={setOpenId}
      />
    </div>
  )
}

export default InvoicesListPage
