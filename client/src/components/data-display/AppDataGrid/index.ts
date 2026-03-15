// AppDataGrid — Barrel exports

// Main component
export { AppDataGrid } from './AppDataGrid'

// Types — all public types
export type {
  // Column
  ColDef,
  ColumnPinned,
  FilterType,
  CellEditType,
  AggFunc,
  AggFuncCustom,
  SortDirection,
  SelectOption,
  ColumnTypes,

  // Params
  CellParams,
  CellRendererParams,
  CellEditorParams,
  ValueGetterParams,
  ValueFormatterParams,
  ValueSetterParams,
  HeaderRendererParams,
  FilterRendererParams,

  // Models
  SortModelItem,
  FilterOperator,
  FilterCondition,
  FilterGroup,
  FilterModel,
  GroupRow,
  EditMode,
  EditingCell,
  EditChange,
  BatchChange,

  // Selection
  RowSelectionMode,
  CellPosition,
  CellRange,
  SelectionState,

  // Export
  ExportParams,
  ExcelExportParams,
  ExcelCellStyle,
  PdfExportParams,

  // Toolbar / Context / Status / Sidebar
  ToolbarItem,
  ContextMenuItem,
  ContextMenuParams,
  StatusBarPanel,
  StatusBarRenderParams,
  SidebarPanel,
  SidebarConfig,

  // Master-Detail & Tree
  DetailRendererParams,
  TreeDataConfig,
  AggregateConfig,

  // State
  GridStateSnapshot,
  GridStatePersistence,
  NamedView,

  // Server-side
  ServerSideRequest,
  ServerSideResponse,
  ServerSideDataSource,

  // Drag
  RowDragEndEvent,

  // Events
  RowClickEvent,
  CellClickEvent,
  SortChangedEvent,
  FilterChangedEvent,
  PaginationChangedEvent,
  SelectionChangedEvent,
  ColumnResizedEvent,
  ColumnReorderedEvent,
  ColumnVisibilityChangedEvent,
  EditStartedEvent,
  EditEndedEvent,

  // API
  GridApi,

  // Locale
  GridLocaleText,

  // Group renderer
  GroupRowRendererParams,

  // Main props
  AppDataGridProps,

  // Internal context
  GridInternalContext,
} from './AppDataGrid.types'

// Helper functions
export { isGroupRow, getColField, getNestedValue, setNestedValue } from './AppDataGrid.types'
