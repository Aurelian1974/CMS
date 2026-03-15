import React, { useMemo } from 'react'
import type {
  ColDef, GroupRow, CellPosition, EditingCell, SelectionState,
} from '../AppDataGrid.types'
import { isGroupRow } from '../AppDataGrid.types'
import { GridRow } from './GridRow'
import { GridGroupRow } from './GridGroupRow'

export interface GridBodyProps<T extends object> {
  rows: Array<T | GroupRow<T>>
  columns: ColDef<T>[]
  columnWidths: Map<string, number>
  startIndex: number
  rowHeight: number
  getRowHeight?: (params: { data: T; rowIndex: number }) => number
  getRowId: (data: T) => string | number

  // Selection
  selectionState: SelectionState<T>
  focusedCell: CellPosition | null

  // Edit
  editingCell: EditingCell | null
  dirtyFields: Map<string, unknown>

  // Expanded details
  expandedDetails: Set<number>

  // Styling
  alternateRows?: boolean
  enableHover?: boolean
  gridLines?: 'horizontal' | 'vertical' | 'both' | 'none'
  rowClass?: string | ((params: { data: T; rowIndex: number }) => string)
  rowClassRules?: Record<string, (params: { data: T; rowIndex: number }) => boolean>
  rowStyle?: React.CSSProperties | ((params: { data: T; rowIndex: number }) => React.CSSProperties)

  // Drag
  rowDragEnabled?: boolean
  dropTargetIndex?: number | null

  // Master-detail
  masterDetail?: boolean
  detailRenderer?: (params: { data: T; rowIndex: number; api: unknown; collapse: () => void }) => React.ReactNode
  detailRowHeight?: number

  // Checkbox
  hasCheckboxSelection: boolean

  // Events
  onRowClick: (data: T, rowIndex: number, e: React.MouseEvent) => void
  onRowDoubleClick?: (data: T, rowIndex: number, e: React.MouseEvent) => void
  onCellClick: (data: T, field: string, rowIndex: number, e: React.MouseEvent) => void
  onCellDoubleClick: (data: T, field: string, rowIndex: number) => void
  onToggleSelection: (data: T, isCtrl: boolean, isShift: boolean) => void
  onToggleGroup: (groupKey: string) => void
  onToggleDetail?: (rowIndex: number) => void
  onDragStart?: (rowIndex: number, data: T, e: React.DragEvent) => void
  onDragOver?: (rowIndex: number, e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDrop?: (rowIndex: number) => void

  // Virtualization
  totalHeight: number
  offsetY: number
  isVirtualized: boolean
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void

  // Edit callbacks
  onStartEdit: (rowIndex: number, field: string) => void
  onSetEditValue: (value: unknown) => void
  onStopEdit: (cancel?: boolean) => void

  // Context menu
  onContextMenu?: (data: T | null, rowIndex: number, field: string, e: React.MouseEvent) => void
  groupRowRenderer?: (params: unknown) => React.ReactNode

  // Empty / loading states
  noDataTemplate?: React.ReactNode
  loadingTemplate?: React.ReactNode
  loading?: boolean
}

export function GridBody<T extends object>(props: GridBodyProps<T>) {
  const {
    rows,
    columns,
    columnWidths,
    startIndex,
    rowHeight,
    getRowHeight,
    getRowId,
    selectionState,
    focusedCell,
    editingCell,
    dirtyFields,
    expandedDetails,
    alternateRows,
    enableHover,
    gridLines,
    rowClass,
    rowClassRules,
    rowStyle,
    rowDragEnabled,
    dropTargetIndex,
    masterDetail,
    detailRenderer,
    detailRowHeight,
    hasCheckboxSelection,
    onRowClick,
    onRowDoubleClick,
    onCellClick,
    onCellDoubleClick,
    onToggleSelection,
    onToggleGroup,
    onToggleDetail,
    onDragStart,
    onDragOver,
    onDragEnd,
    onDrop,
    totalHeight,
    offsetY,
    isVirtualized,
    scrollContainerRef,
    onScroll,
    onStartEdit,
    onSetEditValue,
    onStopEdit,
    onContextMenu,
    groupRowRenderer,
    noDataTemplate,
    loadingTemplate,
    loading,
  } = props

  const gridLinesClass = gridLines ? `adg-body--lines-${gridLines}` : 'adg-body--lines-horizontal'

  if (loading) {
    return (
      <div className="adg-body adg-body--loading">
        {loadingTemplate ?? <div className="adg-loading-overlay"><div className="adg-loading-spinner" /><span>Se încarcă...</span></div>}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="adg-body adg-body--empty">
        {noDataTemplate ?? <div className="adg-no-data">Nu există date de afișat</div>}
      </div>
    )
  }

  return (
    <div
      className={`adg-body ${gridLinesClass}`}
      ref={scrollContainerRef}
      onScroll={onScroll}
      role="rowgroup"
    >
      {isVirtualized && <div style={{ height: offsetY, flexShrink: 0 }} />}

      <div style={isVirtualized ? { minHeight: totalHeight - offsetY } : undefined}>
        {rows.map((row, vi) => {
          const actualIndex = startIndex + vi

          if (isGroupRow<T>(row)) {
            return (
              <GridGroupRow
                key={row.__groupKey}
                groupRow={row}
                columns={columns}
                columnWidths={columnWidths}
                onToggle={() => onToggleGroup(row.__groupKey)}
                customRenderer={groupRowRenderer}
              />
            )
          }

          const data = row as T
          const id = getRowId(data)
          const selected = selectionState.selectedRowIds.has(id)
          const h = getRowHeight ? getRowHeight({ data, rowIndex: actualIndex }) : rowHeight
          const isDropTarget = dropTargetIndex === actualIndex

          // Row class computation
          let extraClass = ''
          if (typeof rowClass === 'function') extraClass = rowClass({ data, rowIndex: actualIndex })
          else if (typeof rowClass === 'string') extraClass = rowClass

          if (rowClassRules) {
            for (const [cls, fn] of Object.entries(rowClassRules)) {
              if (fn({ data, rowIndex: actualIndex })) extraClass += ` ${cls}`
            }
          }

          const extraStyle = typeof rowStyle === 'function'
            ? rowStyle({ data, rowIndex: actualIndex })
            : rowStyle

          const hasExpandedDetail = expandedDetails.has(actualIndex)

          return (
            <React.Fragment key={id}>
              <GridRow
                data={data}
                rowIndex={actualIndex}
                columns={columns}
                columnWidths={columnWidths}
                rowHeight={h}
                isSelected={selected}
                isAlternate={alternateRows ? actualIndex % 2 === 1 : false}
                enableHover={enableHover}
                extraClass={extraClass}
                extraStyle={extraStyle}
                isDropTarget={isDropTarget}
                editingCell={editingCell}
                focusedCell={focusedCell}
                dirtyFields={dirtyFields}
                hasCheckboxSelection={hasCheckboxSelection}
                rowDragEnabled={rowDragEnabled}
                onClick={onRowClick}
                onDoubleClick={onRowDoubleClick}
                onCellClick={onCellClick}
                onCellDoubleClick={onCellDoubleClick}
                onToggleSelection={onToggleSelection}
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDragEnd={onDragEnd}
                onDrop={onDrop}
                onStartEdit={onStartEdit}
                onSetEditValue={onSetEditValue}
                onStopEdit={onStopEdit}
                onContextMenu={onContextMenu}
                masterDetail={masterDetail}
                expandedDetails={expandedDetails}
                onToggleDetail={onToggleDetail ?? (() => {})}
              />
              {hasExpandedDetail && detailRenderer && (
                <div
                  className="adg-detail-row"
                  style={{ height: detailRowHeight }}
                >
                  {detailRenderer({
                    data,
                    rowIndex: actualIndex,
                    api: null,
                    collapse: () => onToggleDetail?.(actualIndex),
                  })}
                </div>
              )}
            </React.Fragment>
          )
        })}
      </div>

      {isVirtualized && (
        <div style={{ height: Math.max(0, totalHeight - offsetY - rows.length * rowHeight), flexShrink: 0 }} />
      )}
    </div>
  )
}
