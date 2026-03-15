import React from 'react'
import type { ColDef, EditingCell, CellPosition } from '../AppDataGrid.types'
import { getColField } from '../AppDataGrid.types'
import { GridCell } from './GridCell'

export interface GridRowProps<T extends object> {
  data: T
  rowIndex: number
  columns: ColDef<T>[]
  columnWidths: Map<string, number>
  rowHeight: number
  isSelected: boolean
  isAlternate: boolean
  enableHover?: boolean
  extraClass: string
  extraStyle?: React.CSSProperties
  isDropTarget: boolean
  editingCell: EditingCell | null
  focusedCell: CellPosition | null
  dirtyFields: Map<string, unknown>
  hasCheckboxSelection: boolean
  rowDragEnabled?: boolean

  onClick: (data: T, rowIndex: number, event: React.MouseEvent) => void
  onDoubleClick?: (data: T, rowIndex: number, event: React.MouseEvent) => void
  onCellClick: (data: T, field: string, rowIndex: number, event: React.MouseEvent) => void
  onCellDoubleClick: (data: T, field: string, rowIndex: number) => void
  onToggleSelection: (data: T, isCtrl: boolean, isShift: boolean) => void
  onDragStart?: (rowIndex: number, data: T, e: React.DragEvent) => void
  onDragOver?: (rowIndex: number, e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  onDrop?: (rowIndex: number) => void
  onStartEdit: (rowIndex: number, field: string) => void
  onSetEditValue: (value: unknown) => void
  onStopEdit: (cancel?: boolean) => void
  onContextMenu?: (data: T | null, rowIndex: number, field: string, e: React.MouseEvent) => void

  masterDetail?: boolean
  expandedDetails: Set<number>
  onToggleDetail: (rowIndex: number) => void
}

export function GridRow<T extends object>(props: GridRowProps<T>) {
  const {
    data, rowIndex, columns, columnWidths, rowHeight,
    isSelected, isAlternate, enableHover, extraClass, extraStyle,
    isDropTarget, editingCell, focusedCell, dirtyFields,
    hasCheckboxSelection, rowDragEnabled,
    onClick, onDoubleClick, onCellClick, onCellDoubleClick,
    onToggleSelection,
    onDragStart, onDragOver, onDragEnd, onDrop,
    onStartEdit, onSetEditValue, onStopEdit,
    onContextMenu,
    masterDetail, expandedDetails, onToggleDetail,
  } = props

  const rowClasses = [
    'adg-row',
    isSelected ? 'adg-row--selected' : '',
    isAlternate ? 'adg-row--alternate' : '',
    enableHover !== false ? 'adg-row--hoverable' : '',
    isDropTarget ? 'adg-row--drop-target' : '',
    extraClass,
  ].filter(Boolean).join(' ')

  return (
    <div
      className={rowClasses}
      style={{ height: rowHeight, ...extraStyle }}
      role="row"
      aria-selected={isSelected}
      aria-rowindex={rowIndex + 1}
      onClick={e => onClick(data, rowIndex, e)}
      onDoubleClick={e => onDoubleClick?.(data, rowIndex, e)}
      onContextMenu={e => {
        e.preventDefault()
        onContextMenu?.(data, rowIndex, '', e)
      }}
      draggable={rowDragEnabled}
      onDragStart={e => onDragStart?.(rowIndex, data, e)}
      onDragOver={e => onDragOver?.(rowIndex, e)}
      onDragEnd={e => onDragEnd?.(e)}
      onDrop={() => onDrop?.(rowIndex)}
    >
      {/* Checkbox cell */}
      {hasCheckboxSelection && (
        <div className="adg-cell adg-cell--checkbox" role="gridcell">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={e => {
              e.stopPropagation()
              onToggleSelection(data, e.ctrlKey || e.metaKey, e.shiftKey)
            }}
            aria-label={`Select row ${rowIndex + 1}`}
          />
        </div>
      )}

      {/* Row drag handle */}
      {rowDragEnabled && (
        <div className="adg-cell adg-cell--drag-handle" role="gridcell">
          <span className="adg-drag-icon">⠿</span>
        </div>
      )}

      {/* Master-Detail expand */}
      {masterDetail && (
        <div
          className="adg-cell adg-cell--detail-toggle"
          role="gridcell"
          onClick={e => { e.stopPropagation(); onToggleDetail(rowIndex) }}
        >
          <span className={expandedDetails.has(rowIndex) ? 'adg-expand-icon--expanded' : 'adg-expand-icon--collapsed'}>
            {expandedDetails.has(rowIndex) ? '▼' : '▶'}
          </span>
        </div>
      )}

      {/* Data cells */}
      {columns.map(col => {
        const field = getColField(col)
        const width = columnWidths.get(field) ?? col.width ?? 150
        const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.field === field
        const isFocused = focusedCell?.rowIndex === rowIndex && focusedCell?.field === field
        const isDirty = dirtyFields.has(`${rowIndex}:${field}`)

        return (
          <GridCell
            key={field}
            data={data}
            field={field}
            colDef={col}
            rowIndex={rowIndex}
            width={width}
            isEditing={isEditing}
            isFocused={isFocused}
            isDirty={isDirty}
            editValue={isEditing ? editingCell?.value : undefined}
            onClick={(e) => onCellClick(data, field, rowIndex, e)}
            onDoubleClick={() => onCellDoubleClick(data, field, rowIndex)}
            onStartEdit={() => onStartEdit(rowIndex, field)}
            onSetEditValue={onSetEditValue}
            onStopEdit={onStopEdit}
            onContextMenu={(e) => {
              e.stopPropagation()
              onContextMenu?.(data, rowIndex, field, e)
            }}
          />
        )
      })}
    </div>
  )
}
