import { useState, useRef, useCallback, useEffect, type MutableRefObject } from 'react'
import {
  GridComponent,
  Inject,
  Page,
  Sort,
  Filter,
  Reorder,
  Resize,
  Freeze,
  ExcelExport,
  PdfExport,
  ColumnChooser,
  Toolbar,
  type FilterSettingsModel,
  type PageSettingsModel,
  type SortSettingsModel,
} from '@syncfusion/ej2-react-grids'
import type { AppDataGridProps, GridServerState } from './AppDataGrid.types'
import { CustomPager } from '@/components/data-display/Pagination'
import styles from './AppDataGrid.module.scss'

// ── Configurări grid constante — identice pe toate paginile ──────────────────
const DEFAULT_FILTER_SETTINGS: FilterSettingsModel = {
  type: 'Menu',
  showFilterBarStatus: true,
}

const DEFAULT_PAGE_SETTINGS: PageSettingsModel = {
  pageSize: 10,
  pageSizes: [5, 10, 20, 50],
}

const DEFAULT_SORT_SETTINGS: SortSettingsModel = {
  columns: [{ field: 'fullName', direction: 'Ascending' }],
}

const SS_PAGE_SIZES = [10, 20, 50, 100]

/**
 * Wrapper standardizat peste Syncfusion GridComponent.
 * Include toate configurările comune (sortare, filtrare, grupare, paginare,
 * freeze, export, column chooser) și stilurile grid container.
 *
 * Două moduri de funcționare:
 *  - Client-side (default): paginare/filtrare/sortare în browser pe dataSource complet.
 *  - Server-side: se activează automat când `onDataStateChange` este transmis.
 *    Syncfusion trackează starea intern (pagina, sortare, grupare) și emite
 *    `dataStateChange` la orice acțiune. Parentul re-fetchuiește API-ul și
 *    actualizează `dataSource` + `serverSideCount`. CustomPager rămâne pentru UI.
 */
export const AppDataGrid = <T extends object = object>({
  dataSource,
  children,
  sortSettings,
  gridRef,
  className,
  height = 'auto',
  rowHeight = 52,
  recordClick,
  // Props server-side
  serverSideCount,
  onDataStateChange,
  initialPageSize = 20,
}: AppDataGridProps<T>) => {
  const serverSide = onDataStateChange !== undefined

  const innerRef = useRef<GridComponent>(null)

  // ── Stare pager client-side ────────────────────────────────────────────────
  const [clientPage, setClientPage] = useState(1)
  const [clientPageSize, setClientPageSize] = useState(DEFAULT_PAGE_SETTINGS.pageSize!)
  const [clientTotal, setClientTotal] = useState(dataSource.length)

  // ── Stare pager server-side (derivată din dataStateChange) ────────────────
  const [ssPage, setSsPage] = useState(1)
  const [ssPageSize, setSsPageSize] = useState(initialPageSize)
  // Ref care ține starea curentă completă (pentru reconstruire la pageSize change)
  const ssStateRef = useRef<GridServerState>({ skip: 0, take: initialPageSize })

  // Valorile efective ale pager-ului (folosite de CustomPager)
  const currentPage  = serverSide ? ssPage    : clientPage
  const pageSize     = serverSide ? ssPageSize : clientPageSize
  const totalRecords = serverSide ? (serverSideCount ?? 0) : clientTotal

  // Callback ref care setează atât innerRef cât și gridRef-ul extern (dacă există)
  const setRef = useCallback((el: GridComponent | null) => {
    (innerRef as MutableRefObject<GridComponent | null>).current = el
    if (!gridRef) return
    if (typeof gridRef === 'function') {
      gridRef(el)
    } else {
      (gridRef as MutableRefObject<GridComponent | null>).current = el
    }
  }, [gridRef])

  // ── Server-side: transmite datele spre Syncfusion în format { result, count } ──
  // Syncfusion înțelege acest format: afișează `result` fără re-slicing intern
  // și știe că totalul este `count` (pentru a calcula numărul de pagini).
  useEffect(() => {
    if (!serverSide) return
    const grid = innerRef.current
    if (!grid) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(grid as any).dataSource = { result: dataSource, count: serverSideCount ?? 0 }
  }, [serverSide, dataSource, serverSideCount])

  // ── Handler dataStateChange din Syncfusion ────────────────────────────────
  // Declanșat la: schimbare pagina (goToPage), sortare coloana, grupare, filtrare.
  // NU se declanșează la randarea inițială.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleSfDataStateChange = useCallback((args: any) => {
    if (!serverSide) return

    // ── Cerere normală: pagina, sortare ─────────────────────────────────────
    const skip: number = args.skip ?? 0
    const take: number = args.take ?? ssPageSize
    const newPage = Math.floor(skip / take) + 1

    setSsPage(newPage)
    setSsPageSize(take)

    const newState: GridServerState = {
      skip,
      take,
      sorted: args.sorted ?? ssStateRef.current.sorted,
      where:  args.where  ?? ssStateRef.current.where,
    }
    ssStateRef.current = newState
    onDataStateChange?.(newState)
  }, [serverSide, onDataStateChange, ssPageSize])

  // ── Sincronizare stare pager după operații client-side ─────────────────────
  const handleDataBound = useCallback(() => {
    if (serverSide) return
    const ps = innerRef.current?.pageSettings
    if (!ps) return
    if (ps.currentPage !== undefined) setClientPage(ps.currentPage)
    if (ps.totalRecordsCount !== undefined) setClientTotal(ps.totalRecordsCount)
    if (ps.pageSize !== undefined) setClientPageSize(ps.pageSize)
  }, [serverSide])

  // ── Handlers CustomPager ───────────────────────────────────────────────────
  const handlePageChange = useCallback((page: number) => {
    if (serverSide) {
      setSsPage(page)
      // goToPage declanșează dataStateChange cu skip/take corecte
      innerRef.current?.goToPage(page)
    } else {
      setClientPage(page)
      innerRef.current?.goToPage(page)
    }
  }, [serverSide])

  const handlePageSizeChange = useCallback((size: number) => {
    if (serverSide) {
      setSsPage(1)
      setSsPageSize(size)
      // Actualizăm pageSettings intern — setProperties poate să nu declanșeze dataStateChange
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(innerRef.current as any)?.setProperties?.({ pageSettings: { pageSize: size, currentPage: 1 } })
      // Emitem manual starea actualizată (cu sorted/group anterioare păstrate)
      const newState: GridServerState = { ...ssStateRef.current, skip: 0, take: size }
      ssStateRef.current = newState
      onDataStateChange?.(newState)
    } else {
      setClientPageSize(size)
      setClientPage(1)
      const grid = innerRef.current
      if (grid) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(grid as any).setProperties({ pageSettings: { pageSize: size, currentPage: 1 } })
      }
    }
  }, [serverSide, onDataStateChange])

  const containerClass = className
    ? `${styles.gridContainer} ${className}`
    : styles.gridContainer

  return (
    <div className={containerClass}>
      <GridComponent
        ref={setRef}
        dataSource={serverSide ? (dataSource as object[]) : dataSource}
        allowSorting
        allowFiltering
        allowGrouping={false}
        allowReordering
        allowResizing
        allowPaging
        allowExcelExport
        allowPdfExport
        showColumnChooser
        toolbar={['ColumnChooser']}
        enableStickyHeader
        enableHover
        filterSettings={DEFAULT_FILTER_SETTINGS}
        pageSettings={
          serverSide
            ? { pageSize: ssPageSize, pageSizes: SS_PAGE_SIZES }
            : DEFAULT_PAGE_SETTINGS
        }
        sortSettings={sortSettings ?? DEFAULT_SORT_SETTINGS}
        height={height}
        gridLines="Horizontal"
        rowHeight={rowHeight}
        recordClick={recordClick}
        dataBound={handleDataBound}
        dataStateChange={serverSide ? handleSfDataStateChange : undefined}
      >
        {children}

        <Inject services={[
          Page, Sort, Filter,
          Reorder, Resize, Freeze,
          ExcelExport, PdfExport, ColumnChooser, Toolbar,
        ]} />
      </GridComponent>

      <CustomPager
        currentPage={currentPage}
        totalRecords={totalRecords}
        pageSize={pageSize}
        pageSizes={serverSide ? SS_PAGE_SIZES : undefined}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  )
}
