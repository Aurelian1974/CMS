import { useCallback, useMemo, useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AppDataGrid } from '@/components/data-display/AppDataGrid'
import type { ColDef, PaginationChangedEvent } from '@/components/data-display/AppDataGrid'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { AppBadge } from '@/components/ui/AppBadge'
import { ListPageToolbar } from '@/components/ui/ListPageToolbar'
import { formatCurrency, formatDateTime } from '@/utils/format'
import { useBillingConsultations } from '../hooks/useBilling'
import { PAYMENT_STATUS_LABELS, paymentStatusVariant, receiptStatusVariant } from '../constants/billing.constants'
import type { BillingConsultationListDto, PaymentStatusFilter } from '../types/billing.types'
import { ConsultationBillingModal } from '../components/ConsultationBillingModal'
import { FiscalStationModal } from '../components/FiscalStationModal'
import styles from './BillingListPage.module.scss'

const IconAlert = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
const IconHalf  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 010 20z" fill="currentColor"/></svg>
const IconCheck = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
const IconPrint = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>

/** Încasări — recepția vede consultațiile finalizate, încasează, emite bon / factură. */
export const BillingListPage = () => {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PaymentStatusFilter>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [openId, setOpenId] = useState<string | null>(null)
  const [stationOpen, setStationOpen] = useState(false)

  const { data: resp, isError } = useBillingConsultations({
    search: search || undefined,
    paymentStatus: statusFilter === 'all' ? undefined : statusFilter,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    page,
    pageSize,
  })

  const rows = useMemo(() => resp?.data?.pagedResult?.items ?? [], [resp])
  const totalCount = resp?.data?.pagedResult?.totalCount ?? 0
  const stats = resp?.data?.stats

  const handlePaginationChanged = useCallback((e: PaginationChangedEvent) => {
    setPage(e.page)
    setPageSize(e.pageSize)
  }, [])

  const columnDefs = useMemo<ColDef<BillingConsultationListDto>[]>(() => [
    { field: 'date', headerName: 'Data', width: 150, minWidth: 130, sortable: false,
      valueFormatter: ({ data }) => (data ? formatDateTime((data as BillingConsultationListDto).date) : '') },
    { field: 'patientName', headerName: 'Pacient', flex: 2, minWidth: 180, sortable: false, ellipsis: true,
      cellRenderer: ({ data }) => data ? <span className={styles.strong}>{data.patientName}</span> : null },
    { field: 'doctorName', headerName: 'Medic', flex: 1, minWidth: 150, sortable: false, ellipsis: true },
    { field: 'total', headerName: 'Total', width: 120, minWidth: 100, sortable: false,
      cellRenderer: ({ data }) => data ? <span className={styles.amount}>{formatCurrency(data.total)}</span> : null },
    { field: 'paid', headerName: 'Încasat', width: 120, minWidth: 100, sortable: false,
      valueFormatter: ({ data }) => (data ? formatCurrency((data as BillingConsultationListDto).paid) : '') },
    { field: 'balance', headerName: 'Rest', width: 120, minWidth: 100, sortable: false,
      cellRenderer: ({ data }) => data
        ? (data.balance > 0 ? <span className={styles.balance}>{formatCurrency(data.balance)}</span> : <span className={styles.muted}>—</span>)
        : null },
    { field: 'paymentStatus', headerName: 'Plată', width: 140, minWidth: 120, sortable: false,
      cellRenderer: ({ data }) => data
        ? <AppBadge variant={paymentStatusVariant(data.paymentStatus)} withDot>{PAYMENT_STATUS_LABELS[data.paymentStatus] ?? data.paymentStatus}</AppBadge>
        : null },
    { field: 'receiptStatusName', headerName: 'Bon fiscal', width: 150, minWidth: 120, sortable: false,
      cellRenderer: ({ data }) => data
        ? (data.receiptStatusCode
            ? <AppBadge variant={receiptStatusVariant(data.receiptStatusCode)} withDot>{data.receiptStatusName}</AppBadge>
            : <span className={styles.muted}>—</span>)
        : null },
    { field: 'invoiceNumber', headerName: 'Factură', width: 130, minWidth: 110, sortable: false,
      valueFormatter: ({ data }) => (data as BillingConsultationListDto | undefined)?.invoiceNumber ?? '—' },
    {
      field: 'consultationId', headerName: '', width: 70, minWidth: 70,
      sortable: false, filterable: false, reorderable: false, resizable: false, pinned: 'right',
      cellRenderer: ({ data }) => data
        ? <div className={styles.actions}><ActionButtons onView={() => setOpenId(data.consultationId)} /></div>
        : null,
    },
  ], [])

  if (isError) {
    return (
      <div className={styles.page}>
        <div className="alert alert-danger m-4">Nu s-a putut încărca lista de încasări. Verifică conexiunea la server.</div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Încasări"
        subtitle="Consultații finalizate — servicii, plăți, bonuri fiscale și facturi"
        actions={
          <button className={styles.btnSecondary} onClick={() => setStationOpen(true)}>
            <IconPrint /> Casa de marcat
          </button>
        }
      />

      <div className={styles.statsBar}>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--red']}`}><IconAlert /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.unpaidCount ?? 0}</span>
            <span className={styles.statLabel}>Neplătite</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--orange']}`}><IconHalf /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.partialCount ?? 0}</span>
            <span className={styles.statLabel}>Plătite parțial</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--green']}`}><IconCheck /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.paidCount ?? 0}</span>
            <span className={styles.statLabel}>Plătite</span>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={`${styles.statIcon} ${styles['statIcon--purple']}`}><IconPrint /></div>
          <div className={styles.statContent}>
            <span className={styles.statValue}>{stats?.receiptsNeedingAttentionCount ?? 0}</span>
            <span className={styles.statLabel}>Bonuri de verificat</span>
          </div>
        </div>
      </div>

      <ListPageToolbar
        search={search}
        onSearchChange={(v) => { setSearch(v); setPage(1) }}
        searchPlaceholder="Caută după pacient..."
        statusFilter={statusFilter}
        onStatusChange={(v) => { setStatusFilter(v); setPage(1) }}
        statusOptions={[
          { value: 'all' as PaymentStatusFilter, label: 'Toate' },
          { value: 'NEPLATIT' as PaymentStatusFilter, label: 'Neplătite' },
          { value: 'PARTIAL' as PaymentStatusFilter, label: 'Parțial' },
          { value: 'PLATIT' as PaymentStatusFilter, label: 'Plătite' },
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
        <AppDataGrid<BillingConsultationListDto>
          rowData={rows}
          columnDefs={columnDefs}
          loading={!resp}
          getRowId={(row) => row.consultationId}
          onRowDoubleClick={(e) => setOpenId(e.data.consultationId)}
          pagination
          pageSize={pageSize}
          pageSizes={[10, 20, 50, 100]}
          showPager
          serverSideCount={totalCount}
          onPaginationChanged={handlePaginationChanged}
          toolbar
          statusBar={[{ type: 'total-count' }]}
          alternateRows
          enableHover
          gridLines="horizontal"
          stickyHeader
        />
      </div>

      <ConsultationBillingModal
        consultationId={openId}
        onClose={() => setOpenId(null)}
      />

      <FiscalStationModal isOpen={stationOpen} onClose={() => setStationOpen(false)} />
    </div>
  )
}

export default BillingListPage
