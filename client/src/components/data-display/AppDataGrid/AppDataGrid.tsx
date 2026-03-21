import React, {
  useState, useCallback, useMemo, useRef,
  forwardRef, useImperativeHandle, useEffect,
} from 'react'
import type {
  AppDataGridProps, GridApi, ToolbarItem,
  CellPosition, FilterCondition,
  ContextMenuItem, ContextMenuParams,
  GridStateSnapshot,
} from './AppDataGrid.types'
import { getColField, isGroupRow, getNestedValue } from './AppDataGrid.types'

// Hooks
import { useGridData } from './hooks/useGridData'
import { useGridColumns } from './hooks/useGridColumns'
import { useGridSelection } from './hooks/useGridSelection'
import { useGridEdit } from './hooks/useGridEdit'
import { useGridExport } from './hooks/useGridExport'
import { useGridState } from './hooks/useGridState'
import { useGridVirtualization } from './hooks/useGridVirtualization'
import { useGridKeyboard } from './hooks/useGridKeyboard'
import { useGridDragDrop } from './hooks/useGridDragDrop'
import { flattenColumns } from './utils/aggregateUtils'

// Components
import { GridHeader } from './components/GridHeader'
import { GridBody } from './components/GridBody'
import { GridPager } from './components/GridPager'
import { GridToolbar, getDefaultToolbarItems } from './components/GridToolbar'
import { GridContextMenu, getDefaultContextMenuItems } from './components/GridContextMenu'
import { GridColumnChooser } from './components/GridColumnChooser'
import { GridStatusBar } from './components/GridStatusBar'
import { GridFooterRow } from './components/GridFooterRow'
import { GridGroupPanel } from './components/GridGroupPanel'
import type { StickyOffset } from './components/GridCell'

import { updateSortModel } from './utils/sortUtils'

import './AppDataGrid.scss'

// ═════════════════════════════════════════════════════════════════════════════
// Component intern tipizat
// ═════════════════════════════════════════════════════════════════════════════

function AppDataGridInner<T extends object>(
  props: AppDataGridProps<T>,
  ref: React.ForwardedRef<GridApi<T>>,
) {
  const {
    rowData,
    columnDefs,
    defaultColDef,
    columnTypes,
    getRowId: getRowIdProp,
    initialSort,
    triStateSort,
    multiSortKey = 'ctrl',
    accentedSort,
    showFilterRow: _showFilterRowProp,
    quickFilterText: _quickFilterTextProp,
    pagination = true,
    pageSize: initialPageSize = 20,
    pageSizes = [10, 20, 50, 100],
    showPager = true,
    rowSelection,
    cellSelection,
    suppressRowDeselection,
    initialGroupBy,
    showGroupPanel,
    groupDefaultExpanded,
    groupRowRenderer,
    stickyGroupHeaders: _stickyGroupHeaders,
    editable,
    editMode,
    singleClickEdit,
    undoRedoEditing,
    stopEditingWhenLoseFocus: _stopEditingWhenLoseFocus,
    masterDetail,
    detailRenderer,
    detailRowHeight,
    aggregates,
    toolbar,
    contextMenu,
    statusBar,
    serverSideDataSource,
    serverSideCount,
    rowDragEnabled,
    rowDragEntireRow,
    rowVirtualization = true,
    overscanRows,
    height = '100%',
    rowHeight: rowHeightProp = 40,
    getRowHeight: getRowHeightProp,
    className,
    style,
    gridLines = 'horizontal',
    alternateRows = true,
    enableHover = true,
    rowClass,
    rowClassRules,
    rowStyle,
    noDataTemplate,
    loadingTemplate,
    loading: loadingProp,
    stickyHeader = true,
    statePersistence,
    localeText,
    rtl,
    onGridReady,
    onRowClick,
    onRowDoubleClick,
    onCellClick,
    onSortChanged,
    onFilterChanged,
    onPaginationChanged,
    onSelectionChanged,
    onColumnResized,
    onColumnReordered,
    onColumnVisibilityChanged,
    onEditStarted,
    onEditEnded,
    onRowDataUpdated,
    onRowDragEnd,
    onStateChanged,
    onFirstDataRendered,
  } = props

  // ── Refs ──────────────────────────────────────────────────────────────────
  const gridRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<GridApi<T>>(null!)
  const firstRenderRef = useRef(true)

  // ── State local ───────────────────────────────────────────────────────────
  const [showColumnChooser, setShowColumnChooser] = useState(false)
  const [contextMenuState, setContextMenuState] = useState<{
    position: { x: number; y: number } | null
    params: ContextMenuParams<T>
  }>({ position: null, params: { data: null, cell: null, area: 'body', api: null! } })
  const [expandedDetails, setExpandedDetails] = useState<Set<number>>(new Set())
  const [focusedCell, setFocusedCell] = useState<CellPosition | null>(null)
  const [internalRowData, setInternalRowData] = useState<T[]>(rowData ?? [])

  // Sync external rowData
  useEffect(() => {
    if (rowData) setInternalRowData(rowData)
  }, [rowData])

  // ── getRowId ──────────────────────────────────────────────────────────────
  const getRowId = useCallback((data: T): string | number => {
    if (getRowIdProp) return getRowIdProp(data)
    const d = data as Record<string, unknown>
    return (d.id ?? d.Id ?? d.ID ?? d._id ?? JSON.stringify(data)) as string | number
  }, [getRowIdProp])

  // ── Columns hook ──────────────────────────────────────────────────────────
  const columnsHook = useGridColumns({
    columnDefs,
    defaultColDef,
    columnTypes,
    onColumnResized,
    onColumnReordered,
    onColumnVisibilityChanged,
  })

  const flat = useMemo(() => flattenColumns(columnsHook.processedColumnDefs), [columnsHook.processedColumnDefs])

  // ── Data hook ─────────────────────────────────────────────────────────────
  const dataHook = useGridData({
    rowData: internalRowData,
    columnDefs: columnsHook.processedColumnDefs,
    initialSort,
    initialGroupBy,
    pageSize: initialPageSize,
    groupDefaultExpanded,
    triStateSort,
    accentedSort,
    pagination,
    aggregates,
    serverSideDataSource,
    serverSideCount,
    onSortChanged,
    onFilterChanged,
    onPaginationChanged,
  })

  // ── Selection hook ────────────────────────────────────────────────────────
  const selectionHook = useGridSelection({
    rowSelection,
    cellSelection,
    suppressRowDeselection,
    getRowId,
    onSelectionChanged,
  })

  // ── Edit hook ─────────────────────────────────────────────────────────────
  const editHook = useGridEdit({
    editable,
    editMode,
    singleClickEdit,
    undoRedoEditing,
    columnDefs: flat,
    getRowId,
    onEditStarted,
    onEditEnded,
    onRowDataUpdated: (data) => {
      setInternalRowData(data)
      onRowDataUpdated?.(data)
    },
  })

  // ── Virtualization hook ───────────────────────────────────────────────────
  const virtHook = useGridVirtualization({
    totalRows: dataHook.displayedRows.length,
    rowHeight: rowHeightProp,
    getRowHeight: getRowHeightProp
      ? (idx) => getRowHeightProp({ data: dataHook.displayedRows[idx] as T, rowIndex: idx })
      : undefined,
    overscanRows,
    enabled: rowVirtualization,
  })

  // ── Export hook ───────────────────────────────────────────────────────────
  const exportHook = useGridExport({
    columnDefs: flat,
    defaultExcelExportParams: props.defaultExcelExportParams,
    defaultCsvExportParams: props.defaultCsvExportParams,
    defaultPdfExportParams: props.defaultPdfExportParams,
    getSelectedRows: () => selectionHook.selectionState.selectedRows,
    getDisplayedRows: () => dataHook.displayedRows,
    getAllRows: () => dataHook.allRows,
    gridRef,
  })

  // ── DragDrop hook ─────────────────────────────────────────────────────────
  const dragHook = useGridDragDrop({
    enabled: rowDragEnabled,
    entireRow: rowDragEntireRow,
    onRowDragEnd,
  })

  // ── Keyboard hook ─────────────────────────────────────────────────────────
  const keyboardHook = useGridKeyboard({
    containerRef: gridRef,
    visibleColumns: columnsHook.allVisibleColumns,
    totalRows: dataHook.displayedRows.length,
    focusedCell,
    setFocusedCell,
    onStartEdit: (rowIndex, field) => {
      const row = dataHook.displayedRows[rowIndex]
      if (row && !isGroupRow(row)) editHook.startEditing(rowIndex, field, row as T)
    },
    onStopEdit: editHook.stopEditing,
    onCopy: exportHook.copySelectionToClipboard,
    onUndo: () => editHook.undo(internalRowData, setInternalRowData),
    onRedo: () => editHook.redo(internalRowData, setInternalRowData),
    onSelectAll: () => {
      const plainRows = dataHook.filteredRows.filter(r => !isGroupRow(r)) as T[]
      selectionHook.selectAll(plainRows)
    },
    isEditing: editHook.editingCell !== null,
    enabled: true,
  })

  // ── State persistence hook ────────────────────────────────────────────────
  const stateHook = useGridState({
    statePersistence,
    onStateChanged,
    getState: () => ({
      columns: flat.map(c => ({
        field: getColField(c),
        width: columnsHook.columnWidths.get(getColField(c)) ?? 150,
        hide: columnsHook.hiddenColumns.has(getColField(c)),
        pinned: columnsHook.pinnedColumns.get(getColField(c)) ?? false,
        sortIndex: dataHook.sortModel.findIndex(s => s.field === getColField(c)),
      })),
      columnOrder: columnsHook.columnOrder,
      sort: dataHook.sortModel,
      filter: dataHook.filterModel,
      group: dataHook.groupFields,
      page: dataHook.page,
      pageSize: dataHook.pageSize,
    }),
    applyState: (state: GridStateSnapshot) => {
      if (state.sort) dataHook.setSort(state.sort)
      if (state.filter) {
        dataHook.clearAllFilters()
        for (const [field, condition] of Object.entries(state.filter)) {
          dataHook.setFilter(field, condition)
        }
      }
      if (state.group) dataHook.setGroupBy(state.group)
      if (state.page) dataHook.setPage(state.page)
      if (state.pageSize) dataHook.setPageSize(state.pageSize)
      if (state.columnOrder) columnsHook.setColumnOrder(state.columnOrder)
      if (state.columns) {
        for (const col of state.columns) {
          if (col.width) columnsHook.setColumnWidth(col.field, col.width)
          columnsHook.setColumnVisible(col.field, !col.hide)
          if (col.pinned !== undefined) columnsHook.setColumnPinned(col.field, col.pinned)
        }
      }
    },
  })

  // ── Sort handler ──────────────────────────────────────────────────────────
  const handleSort = useCallback((field: string, multiSort: boolean) => {
    const useMulti = multiSortKey === 'none' ? true : multiSort
    const newModel = updateSortModel(dataHook.sortModel, field, useMulti, triStateSort ?? false)
    dataHook.setSort(newModel)
    onSortChanged?.({ sort: newModel, source: 'click' })
  }, [dataHook, multiSortKey, triStateSort, onSortChanged])

  // ── Filter handler ────────────────────────────────────────────────────────
  const handleFilterChange = useCallback((field: string, condition: FilterCondition) => {
    dataHook.setFilter(field, condition)
  }, [dataHook])

  const handleFilterClear = useCallback((field: string) => {
    dataHook.setFilter(field, null)
  }, [dataHook])

  // ── Row click handler ─────────────────────────────────────────────────────
  const handleRowClick = useCallback((data: T, rowIndex: number, e: React.MouseEvent) => {
    if (rowSelection) {
      selectionHook.toggleRow(data, e.ctrlKey || e.metaKey, e.shiftKey, dataHook.displayedRows)
    }
    onRowClick?.({ data, rowIndex, event: e })
  }, [rowSelection, selectionHook, dataHook.displayedRows, onRowClick])

  const handleRowDoubleClick = useCallback((data: T, rowIndex: number, e: React.MouseEvent) => {
    onRowDoubleClick?.({ data, rowIndex, event: e })
  }, [onRowDoubleClick])

  // ── Cell click handler ────────────────────────────────────────────────────
  const handleCellClick = useCallback((data: T, field: string, rowIndex: number, e: React.MouseEvent) => {
    setFocusedCell({ rowIndex, field })
    const col = flat.find(c => getColField(c) === field)
    if (col) {
      onCellClick?.({
        data,
        value: getNestedValue(data, field),
        field,
        rowIndex,
        colDef: col,
        event: e,
      })
    }
  }, [flat, onCellClick])

  const handleCellDoubleClick = useCallback((data: T, field: string, rowIndex: number) => {
    if (editable) {
      editHook.startEditing(rowIndex, field, data)
    }
  }, [editable, editHook])

  // ── Context menu ──────────────────────────────────────────────────────────
  const handleContextMenu = useCallback((data: T | null, rowIndex: number, field: string, e: React.MouseEvent) => {
    if (!contextMenu) return
    e.preventDefault()
    setContextMenuState({
      position: { x: e.clientX, y: e.clientY },
      params: {
        data,
        cell: data ? { rowIndex, field } : null,
        area: data ? 'cell' : 'body',
        api: apiRef.current,
      },
    })
  }, [contextMenu])

  // ── Detail toggle ─────────────────────────────────────────────────────────
  const handleToggleDetail = useCallback((rowIndex: number) => {
    setExpandedDetails(prev => {
      const next = new Set(prev)
      if (next.has(rowIndex)) next.delete(rowIndex)
      else next.add(rowIndex)
      return next
    })
  }, [])

  // ── Toolbar ───────────────────────────────────────────────────────────────
  const toolbarItems: ToolbarItem[] = useMemo(() => {
    if (!toolbar) return []
    if (Array.isArray(toolbar)) return toolbar
    return getDefaultToolbarItems(true)
  }, [toolbar])

  // ── Context menu items ────────────────────────────────────────────────────
  const contextMenuItems: ContextMenuItem[] = useMemo(() => {
    if (!contextMenu) return []
    if (Array.isArray(contextMenu)) return contextMenu
    return getDefaultContextMenuItems()
  }, [contextMenu])

  // ── Column headers map ────────────────────────────────────────────────────
  const columnHeaders = useMemo(() => {
    const m = new Map<string, string>()
    for (const col of flat) {
      m.set(getColField(col), col.headerName ?? getColField(col))
    }
    return m
  }, [flat])

  // ── Checkbox detection ────────────────────────────────────────────────────
  const hasCheckboxSelection = useMemo(() =>
    flat.some(c => c.checkboxSelection || c.headerCheckboxSelection),
    [flat]
  )

  // ── Sticky column offsets ─────────────────────────────────────────────────
  const stickyOffsets = useMemo(() => {
    const map = new Map<string, StickyOffset>()

    // Extra columns before the first data column in body rows
    let extraLeft = 0
    if (hasCheckboxSelection) extraLeft += 40
    if (rowDragEnabled) extraLeft += 30
    if (masterDetail) extraLeft += 30

    // Left-pinned columns
    let leftOffset = extraLeft
    for (const col of columnsHook.visibleColumns.left) {
      const field = getColField(col)
      const width = columnsHook.columnWidths.get(field) ?? col.width ?? 150
      map.set(field, { side: 'left', offset: leftOffset })
      leftOffset += width
    }

    // Right-pinned columns (accumulate from the right edge)
    let rightOffset = 0
    for (let i = columnsHook.visibleColumns.right.length - 1; i >= 0; i--) {
      const col = columnsHook.visibleColumns.right[i]
      const field = getColField(col)
      const width = columnsHook.columnWidths.get(field) ?? col.width ?? 150
      map.set(field, { side: 'right', offset: rightOffset })
      rightOffset += width
    }

    return map
  }, [columnsHook.visibleColumns, columnsHook.columnWidths, hasCheckboxSelection, rowDragEnabled, masterDetail])

  // ── API imperative ────────────────────────────────────────────────────────
  const api: GridApi<T> = useMemo(() => ({
    getDisplayedRows: () => dataHook.displayedRows.filter(r => !isGroupRow(r)) as T[],
    getAllRows: () => dataHook.allRows,
    setRowData: setInternalRowData,
    refreshData: () => dataHook.refreshData?.(),
    getRowById: (id) => internalRowData.find(r => getRowId(r) === id),

    getColumnDefs: () => columnsHook.processedColumnDefs,
    setColumnVisible: columnsHook.setColumnVisible,
    setColumnPinned: columnsHook.setColumnPinned,
    autoSizeColumn: (f) => columnsHook.autoSizeColumn(f, internalRowData),
    autoSizeAllColumns: () => columnsHook.autoSizeAllColumns(internalRowData),
    setColumnWidth: columnsHook.setColumnWidth,

    setSort: dataHook.setSort,
    getSort: () => dataHook.sortModel,

    setFilter: (field, condition) => {
      if (condition) dataHook.setFilter(field, condition)
      else dataHook.setFilter(field, null)
    },
    getFilter: (field) => dataHook.filterModel[field] ?? null,
    clearAllFilters: dataHook.clearAllFilters,
    setQuickFilter: dataHook.setQuickFilter,

    goToPage: dataHook.setPage,
    setPageSize: dataHook.setPageSize,
    getCurrentPage: () => dataHook.page,
    getTotalPages: () => Math.ceil(dataHook.filteredCount / dataHook.pageSize),

    getSelectedRows: () => selectionHook.selectionState.selectedRows,
    selectRows: (ids) => selectionHook.selectRows(ids, internalRowData),
    deselectAll: selectionHook.deselectAll,
    selectAll: () => {
      const plainRows = dataHook.filteredRows.filter(r => !isGroupRow(r)) as T[]
      selectionHook.selectAll(plainRows)
    },

    startEditing: (rowIndex, field) => {
      const row = dataHook.displayedRows[rowIndex]
      if (row && !isGroupRow(row)) editHook.startEditing(rowIndex, field, row as T)
    },
    stopEditing: editHook.stopEditing,
    undo: () => editHook.undo(internalRowData, setInternalRowData),
    redo: () => editHook.redo(internalRowData, setInternalRowData),
    getBatchChanges: () => editHook.batchChanges,
    commitBatch: () => editHook.commitBatch(internalRowData, setInternalRowData),
    discardBatch: editHook.discardBatch,

    exportExcel: exportHook.exportExcel,
    exportCsv: exportHook.exportCsv,
    exportPdf: exportHook.exportPdf,
    print: exportHook.print,
    copyToClipboard: exportHook.copySelectionToClipboard,

    setGroupBy: dataHook.setGroupBy,
    toggleGroup: dataHook.toggleGroup,
    expandAllGroups: dataHook.expandAllGroups,
    collapseAllGroups: dataHook.collapseAllGroups,

    getState: stateHook.saveState as unknown as () => GridStateSnapshot,
    setState: (state) => stateHook.loadView?.(state as unknown as string),
    resetState: stateHook.resetState,
    saveView: stateHook.saveView,
    loadView: stateHook.loadView,
    getViews: stateHook.getViews,
    deleteView: stateHook.deleteView,

    scrollToRow: virtHook.scrollToRow,
    scrollToCell: (rowIndex, _field) => virtHook.scrollToRow(rowIndex),

    expandDetail: (rowIndex) => setExpandedDetails(p => new Set(p).add(rowIndex)),
    collapseDetail: (rowIndex) => {
      setExpandedDetails(p => { const n = new Set(p); n.delete(rowIndex); return n })
    },

    getGridElement: () => gridRef.current,
    redraw: () => setInternalRowData(prev => [...prev]),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [
    dataHook, columnsHook, selectionHook, editHook, exportHook,
    stateHook, virtHook, internalRowData, getRowId,
  ])

  apiRef.current = api
  useImperativeHandle(ref, () => api, [api])

  // ── onGridReady ───────────────────────────────────────────────────────────
  useEffect(() => {
    onGridReady?.(api)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── onFirstDataRendered ───────────────────────────────────────────────────
  useEffect(() => {
    if (firstRenderRef.current && dataHook.displayedRows.length > 0) {
      firstRenderRef.current = false
      onFirstDataRendered?.()
    }
  }, [dataHook.displayedRows, onFirstDataRendered])

  // ── Selection helper for header checkbox ──────────────────────────────────
  const allPlainRows = useMemo(() =>
    dataHook.filteredRows.filter(r => !isGroupRow(r)) as T[],
    [dataHook.filteredRows]
  )
  const allSelected = allPlainRows.length > 0 && selectionHook.selectionState.selectedRowIds.size >= allPlainRows.length
  const someSelected = selectionHook.selectionState.selectedRowIds.size > 0 && !allSelected

  const isLoading = loadingProp ?? dataHook.loading

  // ── Visible displayed rows (paginated) ────────────────────────────────────
  const displayedRows = dataHook.pageRows

  // Rows for virtualization
  const virtualRows = useMemo(() => {
    if (!virtHook.isVirtualized) return displayedRows
    return displayedRows.slice(virtHook.visibleRange.start, virtHook.visibleRange.end)
  }, [displayedRows, virtHook])

  return (
    <div
      ref={gridRef}
      className={`adg ${rtl ? 'adg--rtl' : ''} ${className ?? ''}`}
      style={{ height, ...style }}
      role="grid"
      aria-rowcount={dataHook.filteredCount}
      aria-colcount={columnsHook.allVisibleColumns.length}
      tabIndex={0}
      onKeyDown={keyboardHook.handleKeyDown}
    >
      {/* Toolbar */}
      {toolbar && (
        <GridToolbar
          items={toolbarItems}
          quickFilterText={dataHook.quickFilterText}
          onQuickFilterChange={dataHook.setQuickFilter}
          onExportExcel={exportHook.exportExcel}
          onExportCsv={exportHook.exportCsv}
          onExportPdf={exportHook.exportPdf}
          onPrint={exportHook.print}
          onToggleColumnChooser={() => setShowColumnChooser(p => !p)}
          localeText={localeText}
        />
      )}

      {/* Group Panel */}
      {showGroupPanel && (
        <GridGroupPanel
          groupFields={dataHook.groupFields}
          columnHeaders={columnHeaders}
          onRemoveGroup={(field) => {
            dataHook.setGroupBy(dataHook.groupFields.filter(f => f !== field))
          }}
          onClearGroups={() => dataHook.setGroupBy([])}
          onDrop={(field) => {
            if (!dataHook.groupFields.includes(field)) {
              dataHook.setGroupBy([...dataHook.groupFields, field])
            }
          }}
          localeText={localeText}
        />
      )}

      {/* Grid container */}
      <div className="adg__container" ref={columnsHook.containerRef}>
        {/* Header */}
        <GridHeader
          columns={columnsHook.allVisibleColumns}
          columnWidths={columnsHook.columnWidths}
          sortModel={dataHook.sortModel}
          onSort={(field) => handleSort(field, false)}
          onResizeStart={columnsHook.startResize}
          filterModel={dataHook.filterModel as Record<string, unknown>}
          onFilterChange={(field, value) => handleFilterChange(field, value as FilterCondition)}
          onFilterClear={handleFilterClear}
          onColumnDragStart={dragHook.handleColumnDragStart}
          onColumnDragOver={dragHook.handleColumnDragOver}
          onColumnDrop={(field) => dragHook.handleColumnDrop(field, columnsHook.moveColumn, columnsHook.columnOrder)}
          onColumnDragEnd={dragHook.handleColumnDragEnd}
          allSelected={allSelected}
          someSelected={someSelected}
          onToggleSelectAll={() => {
            if (allSelected) selectionHook.deselectAll()
            else selectionHook.selectAll(allPlainRows)
          }}
          stickyHeader={stickyHeader}
          stickyOffsets={stickyOffsets}
        />

        {/* Body */}
        <GridBody
          rows={virtualRows}
          columns={columnsHook.allVisibleColumns}
          columnWidths={columnsHook.columnWidths}
          startIndex={virtHook.isVirtualized ? virtHook.visibleRange.start : 0}
          rowHeight={rowHeightProp}
          getRowHeight={getRowHeightProp}
          getRowId={getRowId}
          selectionState={selectionHook.selectionState}
          editingCell={editHook.editingCell}
          focusedCell={focusedCell}
          dirtyFields={editHook.dirtyMap as unknown as Map<string, unknown>}
          expandedDetails={expandedDetails}

          alternateRows={alternateRows}
          enableHover={enableHover}
          gridLines={gridLines}
          rowClass={rowClass}
          rowClassRules={rowClassRules}
          rowStyle={rowStyle}

          rowDragEnabled={rowDragEnabled}
          dropTargetIndex={dragHook.dropTargetIndex}

          masterDetail={masterDetail}
          detailRenderer={detailRenderer as GridBodyProps<T>['detailRenderer']}
          detailRowHeight={detailRowHeight}

          hasCheckboxSelection={hasCheckboxSelection}

          onRowClick={handleRowClick}
          onRowDoubleClick={handleRowDoubleClick}
          onCellClick={(data, field, rowIndex, e) => handleCellClick(data, field, rowIndex, e)}
          onCellDoubleClick={handleCellDoubleClick}
          onToggleSelection={(data, isCtrl, isShift) => {
            selectionHook.toggleRow(data, isCtrl, isShift, dataHook.displayedRows)
          }}
          onToggleGroup={dataHook.toggleGroup}
          onToggleDetail={handleToggleDetail}
          onDragStart={dragHook.handleDragStart}
          onDragOver={dragHook.handleDragOver}
          onDragEnd={dragHook.handleDragEnd}
          onDrop={(idx) => dragHook.handleDrop(idx, internalRowData, setInternalRowData)}

          totalHeight={virtHook.totalHeight}
          offsetY={virtHook.offsetY}
          isVirtualized={virtHook.isVirtualized}
          scrollContainerRef={virtHook.scrollContainerRef}
          onScroll={virtHook.handleScroll}

          onStartEdit={(rowIndex, field) => {
            const row = displayedRows[rowIndex]
            if (row && !isGroupRow(row)) editHook.startEditing(rowIndex, field, row as T)
          }}
          onSetEditValue={editHook.setEditValue}
          onStopEdit={(cancel) => {
            if (!cancel) editHook.applyEdit(internalRowData, setInternalRowData)
            editHook.stopEditing(cancel)
          }}

          onContextMenu={handleContextMenu as unknown as GridBodyProps<T>['onContextMenu']}
          groupRowRenderer={groupRowRenderer as unknown as GridBodyProps<T>['groupRowRenderer']}

          stickyOffsets={stickyOffsets}

          noDataTemplate={noDataTemplate}
          loadingTemplate={loadingTemplate}
          loading={isLoading}
        />

        {/* Footer aggregate row */}
        {aggregates?.showFooter && (
          <GridFooterRow
            columns={columnsHook.allVisibleColumns}
            columnWidths={columnsHook.columnWidths}
            aggregates={dataHook.footerAggregates as Record<string, Record<string, unknown>>}
            hasCheckboxSelection={hasCheckboxSelection}
          />
        )}
      </div>

      {/* Pager */}
      {pagination && showPager && (
        <GridPager
          page={dataHook.page}
          pageSize={dataHook.pageSize}
          totalCount={dataHook.totalCount}
          filteredCount={dataHook.filteredCount}
          pageSizes={pageSizes}
          onPageChange={dataHook.setPage}
          onPageSizeChange={dataHook.setPageSize}
          localeText={localeText}
        />
      )}

      {/* Status bar */}
      {statusBar && statusBar.length > 0 && (
        <GridStatusBar
          panels={statusBar}
          totalCount={dataHook.totalCount}
          filteredCount={dataHook.filteredCount}
          selectedRows={selectionHook.selectionState.selectedRows}
          displayedRows={allPlainRows}
          footerAggregates={dataHook.footerAggregates as Record<string, Record<string, unknown>>}
          localeText={localeText}
          apiRef={apiRef}
        />
      )}

      {/* Column chooser popup */}
      {showColumnChooser && (
        <div className="adg__overlay">
          <GridColumnChooser
            columns={flat}
            hiddenColumns={columnsHook.hiddenColumns}
            onToggleColumn={columnsHook.setColumnVisible}
            onClose={() => setShowColumnChooser(false)}
            localeText={localeText}
          />
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <GridContextMenu
          items={contextMenuItems}
          position={contextMenuState.position}
          params={contextMenuState.params as ContextMenuParams<unknown>}
          onClose={() => setContextMenuState(prev => ({ ...prev, position: null }))}
        />
      )}
    </div>
  )
}

// ── Type workaround for generic forwardRef ──────────────────────────────────
// React.forwardRef doesn't support generics natively, so we use a typed wrapper

type GridBodyProps<T extends object> = React.ComponentProps<typeof GridBody<T>>

interface AppDataGridComponent {
  <T extends object>(
    props: AppDataGridProps<T> & { ref?: React.Ref<GridApi<T>> }
  ): React.ReactElement | null
}

export const AppDataGrid = forwardRef(AppDataGridInner) as unknown as AppDataGridComponent
