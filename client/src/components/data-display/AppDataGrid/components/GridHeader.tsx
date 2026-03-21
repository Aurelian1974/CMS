import React, { useCallback, useState } from 'react'
import type { ColDef, SortDirection, SortModelItem, FilterCondition } from '../AppDataGrid.types'
import { getColField } from '../AppDataGrid.types'
import { FilterPopup, getOperators } from './GridFilterRow'

export interface StickyOffset {
  side: 'left' | 'right'
  offset: number
}

export interface GridHeaderProps<T extends object> {
  columns: ColDef<T>[]
  columnWidths: Map<string, number>
  sortModel: SortModelItem[]
  onSort: (field: string) => void
  onResizeStart: (field: string, startX: number) => void
  filterModel: Record<string, unknown>
  onFilterChange: (field: string, value: unknown) => void
  onFilterClear: (field: string) => void

  // Column DnD
  onColumnDragStart?: (field: string, e: React.DragEvent) => void
  onColumnDragOver?: (field: string, e: React.DragEvent) => void
  onColumnDrop?: (field: string) => void
  onColumnDragEnd?: () => void

  // Checkbox selection
  allSelected?: boolean
  someSelected?: boolean
  onToggleSelectAll?: () => void

  stickyHeader?: boolean
  stickyOffsets?: Map<string, StickyOffset>
  rtl?: boolean
}

export function GridHeader<T extends object>(props: GridHeaderProps<T>) {
  const {
    columns,
    columnWidths,
    sortModel,
    onSort,
    onResizeStart,
    filterModel,
    onFilterChange,
    onFilterClear,
    onColumnDragStart,
    onColumnDragOver,
    onColumnDrop,
    onColumnDragEnd,
    allSelected,
    someSelected,
    onToggleSelectAll,
    stickyHeader,
    stickyOffsets,
  } = props

  const [openFilterField, setOpenFilterField] = useState<string | null>(null)
  const [filterAnchorRect, setFilterAnchorRect] = useState<DOMRect | null>(null)

  const getSortInfo = useCallback((field: string): { direction: SortDirection; index: number | null } => {
    const idx = sortModel.findIndex(s => s.field === field)
    if (idx === -1) return { direction: null, index: null }
    return { direction: sortModel[idx].direction, index: sortModel.length > 1 ? idx + 1 : null }
  }, [sortModel])

  const handleFilterBtnClick = useCallback((field: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (openFilterField === field) {
      setOpenFilterField(null)
      setFilterAnchorRect(null)
    } else {
      setFilterAnchorRect(e.currentTarget.getBoundingClientRect())
      setOpenFilterField(field)
    }
  }, [openFilterField])

  const handleFilterClose = useCallback(() => {
    setOpenFilterField(null)
    setFilterAnchorRect(null)
  }, [])

  const renderHeaderCell = (col: ColDef<T>) => {
    const field = getColField(col)
    const width = columnWidths.get(field) ?? col.width ?? 150
    const sortInfo = getSortInfo(field)
    const sortable = col.sortable !== false
    const resizable = col.resizable !== false
    const reorderable = col.reorderable !== false
    const filterable = col.filterable !== false
    const filterType = col.filterType ?? 'text'
    const hasFilter = !!filterModel[field]
    const stickyInfo = stickyOffsets?.get(field)

    const headerCellStyle: React.CSSProperties = {
      width,
      minWidth: col.minWidth,
      maxWidth: col.maxWidth,
    }
    if (stickyInfo) {
      headerCellStyle.position = 'sticky'
      if (stickyInfo.side === 'left') {
        headerCellStyle.left = stickyInfo.offset
      } else {
        headerCellStyle.right = stickyInfo.offset
      }
    }

    const pinnedClass = stickyInfo
      ? stickyInfo.side === 'left'
        ? 'adg-header__cell--pinned-left'
        : 'adg-header__cell--pinned-right'
      : ''

    return (
      <div
        key={field}
        className={`adg-header__cell ${sortable ? 'adg-header__cell--sortable' : ''} ${sortInfo.direction ? `adg-header__cell--sorted-${sortInfo.direction}` : ''} ${pinnedClass}`}
        style={headerCellStyle}
        role="columnheader"
        aria-sort={sortInfo.direction === 'asc' ? 'ascending' : sortInfo.direction === 'desc' ? 'descending' : 'none'}
        onClick={() => sortable && onSort(field)}
        draggable={reorderable}
        onDragStart={e => onColumnDragStart?.(field, e)}
        onDragOver={e => onColumnDragOver?.(field, e)}
        onDrop={() => onColumnDrop?.(field)}
        onDragEnd={onColumnDragEnd}
      >
        {/* Checkbox column */}
        {col.headerCheckboxSelection && (
          <input
            type="checkbox"
            className="adg-header__checkbox"
            checked={allSelected}
            ref={el => { if (el) el.indeterminate = !allSelected && !!someSelected }}
            onChange={() => onToggleSelectAll?.()}
            onClick={e => e.stopPropagation()}
          />
        )}

        {/* Header content */}
        <span className="adg-header__text" title={col.headerName ?? field}>
          {col.headerRenderer
            ? col.headerRenderer({
                colDef: col as ColDef,
                displayName: col.headerName ?? field,
                sort: sortInfo.direction,
                sortIndex: sortInfo.index,
              })
            : col.headerName ?? field}
        </span>

        {/* Sort indicator */}
        {sortInfo.direction && (
          <span className="adg-header__sort-icon">
            {sortInfo.direction === 'asc' ? '▲' : '▼'}
            {sortInfo.index !== null && (
              <span className="adg-header__sort-index">{sortInfo.index}</span>
            )}
          </span>
        )}

        {/* Filter icon button */}
        {filterable && !!col.headerName && (
          <button
            className={`adg-header__filter-btn ${hasFilter ? 'adg-header__filter-btn--active' : ''}`}
            title={hasFilter ? 'Modifică filtrul' : 'Filtrează coloana'}
            onClick={e => handleFilterBtnClick(field, e)}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        )}

        {/* Resize handle */}
        {resizable && (
          <div
            className="adg-header__resize-handle"
            draggable={false}
            onMouseDown={e => {
              e.stopPropagation()
              e.preventDefault()
              onResizeStart(field, e.clientX)
            }}
            onClick={e => e.stopPropagation()}
            onDragStart={e => e.preventDefault()}
          />
        )}

        {/* Advanced filter popup */}
        {openFilterField === field && filterAnchorRect && (
          <FilterPopup
            field={field}
            filterType={filterType}
            currentFilter={filterModel[field] as FilterCondition | undefined}
            operators={getOperators(filterType)}
            onApply={(f, cond) => onFilterChange(f, cond)}
            onClear={onFilterClear}
            onClose={handleFilterClose}
            anchorRect={filterAnchorRect}
          />
        )}
      </div>
    )
  }

  const nonRightCols = columns.filter(col => stickyOffsets?.get(getColField(col))?.side !== 'right')
  const rightCols = columns.filter(col => stickyOffsets?.get(getColField(col))?.side === 'right')

  return (
    <div className={`adg-header ${stickyHeader ? 'adg-header--sticky' : ''}`} role="rowgroup">
      {/* Header row */}
      <div className="adg-header__row" role="row">
        {nonRightCols.map(col => renderHeaderCell(col))}
        {rightCols.length > 0 && <div className="adg-header__spacer" aria-hidden="true" />}
        {rightCols.map(col => renderHeaderCell(col))}
      </div>
    </div>
  )
}
