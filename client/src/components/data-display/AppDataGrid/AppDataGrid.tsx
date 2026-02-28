import {
  GridComponent,
  Inject,
  Page,
  Sort,
  Filter,
  Group,
  Reorder,
  Resize,
  Freeze,
  ExcelExport,
  PdfExport,
  ColumnChooser,
  Toolbar,
  type FilterSettingsModel,
  type GroupSettingsModel,
  type PageSettingsModel,
  type SortSettingsModel,
} from '@syncfusion/ej2-react-grids'
import type { AppDataGridProps } from './AppDataGrid.types'
import styles from './AppDataGrid.module.scss'

// ── Configurări grid constante — identice pe toate paginile ──────────────────
const DEFAULT_FILTER_SETTINGS: FilterSettingsModel = {
  type: 'Menu',
  showFilterBarStatus: true,
}

const DEFAULT_GROUP_SETTINGS: GroupSettingsModel = {
  showDropArea: true,
  showGroupedColumn: false,
  showToggleButton: true,
  showUngroupButton: true,
}

const DEFAULT_PAGE_SETTINGS: PageSettingsModel = {
  pageSize: 10,
  pageSizes: [5, 10, 20, 50],
}

const DEFAULT_SORT_SETTINGS: SortSettingsModel = {
  columns: [{ field: 'fullName', direction: 'Ascending' }],
}

/**
 * Wrapper standardizat peste Syncfusion GridComponent.
 * Include toate configurările comune (sortare, filtrare, grupare, paginare,
 * freeze, export, column chooser) și stilurile grid container.
 *
 * Coloanele se transmit ca children (`<ColumnsDirective>` + `<ColumnDirective>`).
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
}: AppDataGridProps<T>) => {
  const containerClass = className
    ? `${styles.gridContainer} ${className}`
    : styles.gridContainer

  return (
    <div className={containerClass}>
      <GridComponent
        ref={gridRef}
        dataSource={dataSource}
        allowSorting
        allowFiltering
        allowGrouping
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
        groupSettings={DEFAULT_GROUP_SETTINGS}
        pageSettings={DEFAULT_PAGE_SETTINGS}
        sortSettings={sortSettings ?? DEFAULT_SORT_SETTINGS}
        height={height}
        gridLines="Horizontal"
        rowHeight={rowHeight}
        recordClick={recordClick}
      >
        {children}

        <Inject services={[
          Page, Sort, Filter, Group,
          Reorder, Resize, Freeze,
          ExcelExport, PdfExport, ColumnChooser, Toolbar,
        ]} />
      </GridComponent>
    </div>
  )
}
