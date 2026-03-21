import type { ReactNode, CSSProperties } from 'react'

// ═══════════════════════════════════════════════════════════════════════════════
// AppDataGrid — Tipuri complete pentru grid custom
// ═══════════════════════════════════════════════════════════════════════════════

// ── 1. COLUMN DEFINITION ─────────────────────────────────────────────────────

export type ColumnPinned = 'left' | 'right' | false
export type FilterType = 'text' | 'number' | 'date' | 'boolean' | 'set' | 'custom'
export type CellEditType = 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'textarea' | 'custom'
export type AggFunc = 'sum' | 'avg' | 'count' | 'min' | 'max' | AggFuncCustom
export type AggFuncCustom = (params: { values: unknown[] }) => unknown
export type SortDirection = 'asc' | 'desc' | null

export interface SelectOption {
  value: string | number
  label: string
}

/** Definiția completă a unei coloane. */
export interface ColDef<T = unknown> {
  colId?: string
  field?: string
  headerName?: string

  // ── Dimensiuni ──
  width?: number
  minWidth?: number
  maxWidth?: number
  flex?: number

  // ── Vizibilitate & Poziție ──
  hide?: boolean
  pinned?: ColumnPinned
  lockPosition?: boolean
  lockPinned?: boolean

  // ── Sortare ──
  sortable?: boolean
  comparator?: (a: unknown, b: unknown, rowA: T, rowB: T, isDesc: boolean) => number
  sort?: SortDirection
  sortIndex?: number

  // ── Filtrare ──
  filterable?: boolean
  filterType?: FilterType
  filterOptions?: SelectOption[]
  filterRenderer?: (params: FilterRendererParams) => ReactNode

  // ── Resize & Reorder ──
  resizable?: boolean
  reorderable?: boolean

  // ── Editare ──
  editable?: boolean | ((params: CellParams<T>) => boolean)
  editType?: CellEditType
  editOptions?: SelectOption[]
  cellEditor?: (params: CellEditorParams<T>) => ReactNode
  validator?: (params: CellParams<T>) => string | null
  valueSetter?: (params: ValueSetterParams<T>) => boolean

  // ── Rendering ──
  cellRenderer?: (params: CellRendererParams<T>) => ReactNode
  headerRenderer?: (params: HeaderRendererParams) => ReactNode
  valueGetter?: (params: ValueGetterParams<T>) => unknown
  valueFormatter?: (params: ValueFormatterParams<T>) => string
  clipboardFormatter?: (params: ValueFormatterParams<T>) => string

  // ── Tooltip ──
  tooltipField?: string | boolean
  tooltipRenderer?: (params: CellRendererParams<T>) => ReactNode

  // ── Spanning ──
  colSpan?: (params: CellParams<T>) => number
  rowSpan?: (params: CellParams<T>) => number

  // ── Stilizare ──
  cellClass?: string | ((params: CellParams<T>) => string)
  cellClassRules?: Record<string, (params: CellParams<T>) => boolean>
  cellStyle?: CSSProperties | ((params: CellParams<T>) => CSSProperties)
  headerClass?: string

  // ── Agregare ──
  aggFunc?: AggFunc

  // ── Column Groups (stacked headers) ──
  children?: ColDef<T>[]
  collapsible?: boolean
  collapsed?: boolean

  // ── Flags speciale ──
  rowDrag?: boolean
  checkboxSelection?: boolean
  headerCheckboxSelection?: boolean
  type?: string | string[]
  excludeFromQuickFilter?: boolean
  excludeFromExport?: boolean
  enableGrouping?: boolean
  enablePivot?: boolean
  ellipsis?: boolean
  wrapText?: boolean
}

// ── 2. PARAMS ────────────────────────────────────────────────────────────────

export interface CellParams<T = unknown> {
  value: unknown
  data: T
  colDef: ColDef<T>
  rowIndex: number
  field: string
  api: GridApi<T>
}

export interface CellRendererParams<T = unknown> extends CellParams<T> {
  formattedValue: string
}

export interface CellEditorParams<T = unknown> extends CellParams<T> {
  stopEditing: (cancel?: boolean) => void
  currentValue: unknown
  setValue: (value: unknown) => void
}

export interface ValueGetterParams<T = unknown> {
  data: T
  colDef: ColDef<T>
  field: string
  api: GridApi<T>
}

export interface ValueFormatterParams<T = unknown> {
  value: unknown
  data: T
  colDef: ColDef<T>
  field: string
}

export interface ValueSetterParams<T = unknown> {
  data: T
  colDef: ColDef<T>
  field: string
  oldValue: unknown
  newValue: unknown
}

export interface HeaderRendererParams {
  colDef: ColDef
  displayName: string
  sort: SortDirection
  sortIndex: number | null
}

export interface FilterRendererParams {
  colDef: ColDef
  field: string
  filterValue: unknown
  setFilter: (value: unknown) => void
  clearFilter: () => void
}

// ── 3. SORT MODEL ────────────────────────────────────────────────────────────

export interface SortModelItem {
  field: string
  direction: SortDirection
}

// ── 4. FILTER MODEL ──────────────────────────────────────────────────────────

export type FilterOperator =
  | 'equals' | 'notEquals'
  | 'contains' | 'notContains'
  | 'startsWith' | 'endsWith'
  | 'greaterThan' | 'greaterThanOrEqual'
  | 'lessThan' | 'lessThanOrEqual'
  | 'between'
  | 'inList' | 'notInList'
  | 'blank' | 'notBlank'
  | 'custom'

export interface FilterCondition {
  field: string
  operator: FilterOperator
  value: unknown
  valueTo?: unknown
  customFn?: (value: unknown, row: unknown) => boolean
}

export interface FilterGroup {
  logic: 'and' | 'or'
  conditions: Array<FilterCondition | FilterGroup>
}

export type FilterModel = Record<string, FilterCondition | FilterGroup>

// ── 5. GROUP MODEL ───────────────────────────────────────────────────────────

export interface GroupRow<T = unknown> {
  __isGroup: true
  __groupField: string
  __groupValue: unknown
  __groupKey: string
  __groupLevel: number
  __childCount: number
  __expanded: boolean
  __children: Array<T | GroupRow<T>>
  __aggregates: Record<string, unknown>
}

// ── 6. SELECTION ─────────────────────────────────────────────────────────────

export type RowSelectionMode = 'single' | 'multiple' | false

export interface CellPosition {
  rowIndex: number
  field: string
}

export interface CellRange {
  start: CellPosition
  end: CellPosition
}

export interface SelectionState<T = unknown> {
  selectedRowIds: Set<string | number>
  selectedRows: T[]
  selectedCells: CellPosition[]
  cellRanges: CellRange[]
}

// ── 7. EDIT ──────────────────────────────────────────────────────────────────

export type EditMode = 'cell' | 'row' | 'popup' | 'batch'

export interface EditingCell {
  rowIndex: number
  field: string
  value: unknown
  originalValue: unknown
}

export interface EditChange<T = unknown> {
  rowIndex: number
  field: string
  data: T
  oldValue: unknown
  newValue: unknown
  timestamp: number
}

export interface BatchChange<T = unknown> {
  added: T[]
  updated: EditChange<T>[]
  deleted: T[]
}

// ── 8. EXPORT ────────────────────────────────────────────────────────────────

export interface ExportParams {
  fileName?: string
  onlySelected?: boolean
  includeGroups?: boolean
  includeAggregates?: boolean
  columnFields?: string[]
  customHeaders?: string[]
}

export interface ExcelExportParams extends ExportParams {
  sheetName?: string
  headerStyle?: ExcelCellStyle
  cellStyle?: ExcelCellStyle
}

export interface ExcelCellStyle {
  fontName?: string
  fontSize?: number
  bold?: boolean
  italic?: boolean
  fontColor?: string
  bgColor?: string
  borderColor?: string
  hAlign?: 'left' | 'center' | 'right'
  vAlign?: 'top' | 'middle' | 'bottom'
  numberFormat?: string
}

export interface PdfExportParams extends ExportParams {
  orientation?: 'portrait' | 'landscape'
  pageSize?: 'a3' | 'a4' | 'a5' | 'letter' | 'legal'
  title?: string
  footer?: string
  theme?: 'striped' | 'grid' | 'plain'
}

// ── 9. TOOLBAR ───────────────────────────────────────────────────────────────

export interface ToolbarItem {
  id: string
  type: 'search' | 'export-excel' | 'export-csv' | 'export-pdf' | 'print'
       | 'column-chooser' | 'separator' | 'custom'
  text?: string
  icon?: ReactNode
  align?: 'left' | 'right'
  disabled?: boolean
  onClick?: () => void
  render?: () => ReactNode
}

// ── 10. CONTEXT MENU ─────────────────────────────────────────────────────────

export interface ContextMenuItem {
  id: string
  text: string
  icon?: ReactNode
  disabled?: boolean | ((params: ContextMenuParams) => boolean)
  children?: ContextMenuItem[]
  action?: (params: ContextMenuParams) => void
  separator?: boolean
}

export interface ContextMenuParams<T = unknown> {
  data: T | null
  cell: CellPosition | null
  area: 'cell' | 'header' | 'body'
  api: GridApi<T>
}

// ── 11. STATUS BAR ───────────────────────────────────────────────────────────

export interface StatusBarPanel {
  id: string
  type: 'selected-count' | 'total-count' | 'filtered-count' | 'sum' | 'avg' | 'min' | 'max' | 'custom'
  field?: string
  label?: string
  align?: 'left' | 'center' | 'right'
  render?: (params: StatusBarRenderParams) => ReactNode
}

export interface StatusBarRenderParams<T = unknown> {
  api: GridApi<T>
  selectedRows: T[]
  totalCount: number
  filteredCount: number
}

// ── 12. SIDEBAR ──────────────────────────────────────────────────────────────

export interface SidebarPanel {
  id: string
  type: 'columns' | 'filters' | 'custom'
  icon?: ReactNode
  title?: string
  render?: () => ReactNode
}

export type SidebarConfig = boolean | SidebarPanel[]

// ── 13. MASTER-DETAIL ────────────────────────────────────────────────────────

export interface DetailRendererParams<T = unknown> {
  data: T
  rowIndex: number
  api: GridApi<T>
  collapse: () => void
}

// ── 14. TREE DATA ────────────────────────────────────────────────────────────

export interface TreeDataConfig<T = unknown> {
  getDataPath: (data: T) => string[]
  defaultExpandedLevel?: number
  enableTreeDrag?: boolean
}

// ── 15. AGGREGATE / SUMMARY ─────────────────────────────────────────────────

export interface AggregateConfig {
  showFooter?: boolean
  showGroupFooter?: boolean
  showTotalFooter?: boolean
  customAggFuncs?: Record<string, AggFuncCustom>
}

// ── 16. PERSISTENȚĂ / STATE ──────────────────────────────────────────────────

export interface GridStateSnapshot {
  columns: Array<{
    field: string
    width: number
    hide: boolean
    pinned: ColumnPinned
    sortIndex: number
  }>
  columnOrder: string[]
  sort: SortModelItem[]
  filter: FilterModel
  group: string[]
  page: number
  pageSize: number
}

export interface GridStatePersistence {
  gridId: string
  autoSave?: boolean
}

export interface NamedView {
  name: string
  state: GridStateSnapshot
  createdAt: number
}

// ── 17. SERVER-SIDE ──────────────────────────────────────────────────────────

export interface ServerSideRequest {
  page: number
  pageSize: number
  sort: SortModelItem[]
  filter: FilterModel
  group: string[]
  quickFilter?: string
}

export interface ServerSideResponse<T = unknown> {
  data: T[]
  totalCount: number
  filteredCount?: number
  aggregates?: Record<string, Record<string, unknown>>
}

export type ServerSideDataSource<T = unknown> = (
  request: ServerSideRequest
) => Promise<ServerSideResponse<T>>

// ── 18. DRAG & DROP ──────────────────────────────────────────────────────────

export interface RowDragEndEvent<T = unknown> {
  data: T
  fromIndex: number
  toIndex: number
}

// ── 19. EVENTS ───────────────────────────────────────────────────────────────

export interface RowClickEvent<T = unknown> {
  data: T
  rowIndex: number
  event: React.MouseEvent
}

export interface CellClickEvent<T = unknown> {
  data: T
  value: unknown
  field: string
  rowIndex: number
  colDef: ColDef<T>
  event: React.MouseEvent
}

export interface SortChangedEvent {
  sort: SortModelItem[]
  source: 'click' | 'api'
}

export interface FilterChangedEvent {
  filter: FilterModel
  quickFilter: string
  source: 'ui' | 'api'
}

export interface PaginationChangedEvent {
  page: number
  pageSize: number
  totalPages: number
  totalRecords: number
}

export interface SelectionChangedEvent<T = unknown> {
  selectedRows: T[]
  selectedRowIds: Set<string | number>
}

export interface ColumnResizedEvent {
  field: string
  newWidth: number
  oldWidth: number
}

export interface ColumnReorderedEvent {
  field: string
  fromIndex: number
  toIndex: number
}

export interface ColumnVisibilityChangedEvent {
  field: string
  visible: boolean
}

export interface EditStartedEvent<T = unknown> {
  data: T
  field: string
  rowIndex: number
  value: unknown
}

export interface EditEndedEvent<T = unknown> {
  data: T
  field: string
  rowIndex: number
  oldValue: unknown
  newValue: unknown
  cancelled: boolean
}

// ── 20. GRID API (imperative ref) ───────────────────────────────────────────

export interface GridApi<T = unknown> {
  // Data
  getDisplayedRows: () => T[]
  getAllRows: () => T[]
  setRowData: (data: T[]) => void
  refreshData: () => void
  getRowById: (id: string | number) => T | undefined

  // Columns
  getColumnDefs: () => ColDef<T>[]
  setColumnVisible: (field: string, visible: boolean) => void
  setColumnPinned: (field: string, pinned: ColumnPinned) => void
  autoSizeColumn: (field: string) => void
  autoSizeAllColumns: () => void
  setColumnWidth: (field: string, width: number) => void

  // Sort
  setSort: (sort: SortModelItem[]) => void
  getSort: () => SortModelItem[]

  // Filter
  setFilter: (field: string, condition: FilterCondition | null) => void
  getFilter: (field: string) => FilterCondition | FilterGroup | null
  clearAllFilters: () => void
  setQuickFilter: (text: string) => void

  // Pagination
  goToPage: (page: number) => void
  setPageSize: (size: number) => void
  getCurrentPage: () => number
  getTotalPages: () => number

  // Selection
  getSelectedRows: () => T[]
  selectRows: (ids: Array<string | number>) => void
  deselectAll: () => void
  selectAll: () => void

  // Edit
  startEditing: (rowIndex: number, field: string) => void
  stopEditing: (cancel?: boolean) => void
  undo: () => void
  redo: () => void
  getBatchChanges: () => BatchChange<T>
  commitBatch: () => void
  discardBatch: () => void

  // Export
  exportExcel: (params?: ExcelExportParams) => void
  exportCsv: (params?: ExportParams) => void
  exportPdf: (params?: PdfExportParams) => void
  print: () => void
  copyToClipboard: () => void

  // Group
  setGroupBy: (fields: string[]) => void
  toggleGroup: (groupKey: string) => void
  expandAllGroups: () => void
  collapseAllGroups: () => void

  // State
  getState: () => GridStateSnapshot
  setState: (state: GridStateSnapshot) => void
  resetState: () => void
  saveView: (name: string) => void
  loadView: (name: string) => void
  getViews: () => NamedView[]
  deleteView: (name: string) => void

  // Scroll
  scrollToRow: (rowIndex: number) => void
  scrollToCell: (rowIndex: number, field: string) => void

  // Master-Detail
  expandDetail: (rowIndex: number) => void
  collapseDetail: (rowIndex: number) => void

  // Misc
  getGridElement: () => HTMLDivElement | null
  redraw: () => void
}

// ── 21. LOCALIZARE ───────────────────────────────────────────────────────────

export interface GridLocaleText {
  // Pager
  page?: string
  of?: string
  items?: string
  itemsPerPage?: string
  firstPage?: string
  previousPage?: string
  nextPage?: string
  lastPage?: string
  // Filter
  filterPlaceholder?: string
  filterEquals?: string
  filterNotEquals?: string
  filterContains?: string
  filterNotContains?: string
  filterStartsWith?: string
  filterEndsWith?: string
  filterGreaterThan?: string
  filterLessThan?: string
  filterBetween?: string
  filterBlank?: string
  filterNotBlank?: string
  filterApply?: string
  filterClear?: string
  filterTitle?: string
  // Sort
  sortAscending?: string
  sortDescending?: string
  sortNone?: string
  // Toolbar
  search?: string
  searchPlaceholder?: string
  exportExcel?: string
  exportCsv?: string
  exportPdf?: string
  print?: string
  columnChooser?: string
  // Group
  groupPanelPlaceholder?: string
  expandAll?: string
  collapseAll?: string
  // Edit
  editSave?: string
  editCancel?: string
  editDelete?: string
  addRow?: string
  batchCommit?: string
  batchDiscard?: string
  // Selection
  selectedCount?: string
  selectAll?: string
  deselectAll?: string
  // Context menu
  copy?: string
  paste?: string
  cut?: string
  // General
  noData?: string
  loading?: string
  totalRecords?: string
  filteredRecords?: string
  // Column chooser
  columnChooserTitle?: string
  columnChooserSearch?: string
  columnChooserSelectAll?: string
  // State
  saveView?: string
  loadView?: string
  resetView?: string
  deleteView?: string
  viewName?: string
}

// ── 22. COLUMN TYPES ─────────────────────────────────────────────────────────

export type ColumnTypes<T = unknown> = Record<string, Partial<ColDef<T>>>

// ── 23. GROUP ROW RENDERER PARAMS ────────────────────────────────────────────

export interface GroupRowRendererParams<T = unknown> {
  groupField: string
  groupValue: unknown
  groupKey: string
  level: number
  childCount: number
  expanded: boolean
  toggleExpand: () => void
  aggregates: Record<string, unknown>
  api: GridApi<T>
}

// ── 24. MAIN PROPS ───────────────────────────────────────────────────────────

export interface AppDataGridProps<T extends object = object> {
  // ── Date ──
  rowData?: T[]
  getRowId?: (data: T) => string | number

  // ── Coloane ──
  columnDefs: ColDef<T>[]
  defaultColDef?: Partial<ColDef<T>>
  columnTypes?: ColumnTypes<T>

  // ── Sortare ──
  initialSort?: SortModelItem[]
  triStateSort?: boolean
  multiSortKey?: 'ctrl' | 'shift' | 'none'
  accentedSort?: boolean

  // ── Filtrare ──
  showFilterRow?: boolean
  quickFilterText?: string
  excludeHiddenColumnsFromQuickFilter?: boolean

  // ── Paginare ──
  pagination?: boolean
  pageSize?: number
  pageSizes?: number[]
  showPager?: boolean

  // ── Selecție ──
  rowSelection?: RowSelectionMode
  cellSelection?: boolean
  suppressRowDeselection?: boolean
  persistSelection?: boolean

  // ── Grupare ──
  initialGroupBy?: string[]
  showGroupPanel?: boolean
  groupDefaultExpanded?: number
  groupRowRenderer?: (params: GroupRowRendererParams<T>) => ReactNode
  stickyGroupHeaders?: boolean

  // ── Editare ──
  editable?: boolean
  editMode?: EditMode
  singleClickEdit?: boolean
  undoRedoEditing?: boolean
  stopEditingWhenLoseFocus?: boolean

  // ── Master-Detail ──
  masterDetail?: boolean
  detailRenderer?: (params: DetailRendererParams<T>) => ReactNode
  detailRowHeight?: number
  keepDetailRows?: boolean

  // ── Tree Data ──
  treeData?: TreeDataConfig<T>

  // ── Agregare ──
  aggregates?: AggregateConfig

  // ── Export defaults ──
  defaultExcelExportParams?: ExcelExportParams
  defaultCsvExportParams?: ExportParams
  defaultPdfExportParams?: PdfExportParams

  // ── Toolbar ──
  toolbar?: boolean | ToolbarItem[]

  // ── Context Menu ──
  contextMenu?: boolean | ContextMenuItem[]

  // ── Status Bar ──
  statusBar?: StatusBarPanel[]

  // ── Sidebar ──
  sideBar?: SidebarConfig

  // ── Server-Side ──
  serverSideDataSource?: ServerSideDataSource<T>
  serverSideCount?: number

  // ── Drag & Drop ──
  rowDragEnabled?: boolean
  rowDragEntireRow?: boolean

  // ── Virtualization ──
  rowVirtualization?: boolean
  columnVirtualization?: boolean
  overscanRows?: number

  // ── Aspect & Stilizare ──
  height?: string | number
  rowHeight?: number
  getRowHeight?: (params: { data: T; rowIndex: number }) => number
  autoRowHeight?: boolean
  className?: string
  style?: CSSProperties
  gridLines?: 'horizontal' | 'vertical' | 'both' | 'none'
  alternateRows?: boolean
  enableHover?: boolean
  rowClass?: string | ((params: { data: T; rowIndex: number }) => string)
  rowClassRules?: Record<string, (params: { data: T; rowIndex: number }) => boolean>
  rowStyle?: CSSProperties | ((params: { data: T; rowIndex: number }) => CSSProperties)
  noDataTemplate?: ReactNode
  loadingTemplate?: ReactNode
  loading?: boolean
  stickyHeader?: boolean

  // ── Persistență ──
  statePersistence?: GridStatePersistence

  // ── Localizare ──
  localeText?: Partial<GridLocaleText>
  dateFormat?: string
  numberFormat?: Intl.NumberFormatOptions

  // ── RTL ──
  rtl?: boolean

  // ── Pivot ──
  pivotMode?: boolean

  // ── Accesibilitate ──
  ensureDomOrder?: boolean

  // ── Evenimente ──
  onGridReady?: (api: GridApi<T>) => void
  onRowClick?: (event: RowClickEvent<T>) => void
  onRowDoubleClick?: (event: RowClickEvent<T>) => void
  onCellClick?: (event: CellClickEvent<T>) => void
  onSortChanged?: (event: SortChangedEvent) => void
  onFilterChanged?: (event: FilterChangedEvent) => void
  onPaginationChanged?: (event: PaginationChangedEvent) => void
  onSelectionChanged?: (event: SelectionChangedEvent<T>) => void
  onColumnResized?: (event: ColumnResizedEvent) => void
  onColumnReordered?: (event: ColumnReorderedEvent) => void
  onColumnVisibilityChanged?: (event: ColumnVisibilityChangedEvent) => void
  onEditStarted?: (event: EditStartedEvent<T>) => void
  onEditEnded?: (event: EditEndedEvent<T>) => void
  onRowDataUpdated?: (data: T[]) => void
  onRowDragEnd?: (event: RowDragEndEvent<T>) => void
  onStateChanged?: (state: GridStateSnapshot) => void
  onScroll?: (params: { scrollTop: number; scrollLeft: number }) => void
  onFirstDataRendered?: () => void
}

// ── 25. GRID CONTEXT (internal, shared between sub-components) ───────────────

export interface GridInternalContext<T extends object = object> {
  props: AppDataGridProps<T>
  api: GridApi<T>

  columnDefs: ColDef<T>[]
  columnOrder: string[]
  columnWidths: Map<string, number>
  hiddenColumns: Set<string>
  pinnedColumns: Map<string, ColumnPinned>

  displayedRows: Array<T | GroupRow<T>>
  totalCount: number
  filteredCount: number

  sortModel: SortModelItem[]
  filterModel: FilterModel
  quickFilterText: string
  groupFields: string[]
  expandedGroups: Set<string>

  page: number
  pageSize: number

  selectionState: SelectionState<T>

  editingCell: EditingCell | null
  dirtyMap: Map<string, EditChange<T>>

  expandedDetails: Set<number>

  loading: boolean
}

/** Verifică dacă un rând este grup. */
export function isGroupRow<T>(row: T | GroupRow<T>): row is GroupRow<T> {
  return row !== null && typeof row === 'object' && '__isGroup' in row && row.__isGroup === true
}

/** Obține field-ul efectiv al unei coloane, cu fallback pe colId. */
export function getColField<T extends object>(col: ColDef<T>): string {
  return col.field ?? col.colId ?? ''
}

/** Obține valoarea unei proprietăți nested (ex: "address.city"). */
export function getNestedValue(obj: unknown, path: string): unknown {
  if (!path) return undefined
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

/** Setează valoarea unei proprietăți nested. */
export function setNestedValue(obj: unknown, path: string, value: unknown): void {
  if (!path || !obj) return
  const parts = path.split('.')
  let current = obj as Record<string, unknown>
  for (let i = 0; i < parts.length - 1; i++) {
    if (current[parts[i]] === undefined || current[parts[i]] === null) {
      current[parts[i]] = {}
    }
    current = current[parts[i]] as Record<string, unknown>
  }
  current[parts[parts.length - 1]] = value
}
