import React, { useCallback, useMemo } from 'react'
import type { ColDef, SortDirection, SortModelItem, ColumnPinned } from '../AppDataGrid.types'
import { getColField } from '../AppDataGrid.types'

export interface GridHeaderProps<T extends object> {
  columns: ColDef<T>[]
  columnWidths: Map<string, number>
  sortModel: SortModelItem[]
  onSort: (field: string) => void
  onResizeStart: (field: string, startX: number) => void
  showFilterRow?: boolean
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

  pinnedSection?: 'left' | 'center' | 'right'
  stickyHeader?: boolean
  rtl?: boolean
}

export function GridHeader<T extends object>(props: GridHeaderProps<T>) {
  const {
    columns,
    columnWidths,
    sortModel,
    onSort,
    onResizeStart,
    showFilterRow,
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
  } = props

  const getSortInfo = useCallback((field: string): { direction: SortDirection; index: number | null } => {
    const idx = sortModel.findIndex(s => s.field === field)
    if (idx === -1) return { direction: null, index: null }
    return { direction: sortModel[idx].direction, index: sortModel.length > 1 ? idx + 1 : null }
  }, [sortModel])

  return (
    <div className={`adg-header ${stickyHeader ? 'adg-header--sticky' : ''}`} role="rowgroup">
      {/* Header row */}
      <div className="adg-header__row" role="row">
        {columns.map(col => {
          const field = getColField(col)
          const width = columnWidths.get(field) ?? col.width ?? 150
          const sortInfo = getSortInfo(field)
          const sortable = col.sortable !== false
          const resizable = col.resizable !== false
          const reorderable = col.reorderable !== false

          return (
            <div
              key={field}
              className={`adg-header__cell ${sortable ? 'adg-header__cell--sortable' : ''} ${sortInfo.direction ? `adg-header__cell--sorted-${sortInfo.direction}` : ''}`}
              style={{ width, minWidth: col.minWidth, maxWidth: col.maxWidth }}
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
            </div>
          )
        })}
      </div>

      {/* Filter row */}
      {showFilterRow && (
        <div className="adg-header__filter-row" role="row">
          {columns.map(col => {
            const field = getColField(col)
            const width = columnWidths.get(field) ?? col.width ?? 150
            const filterable = col.filterable !== false

            if (!filterable) {
              return <div key={field} className="adg-header__filter-cell adg-header__filter-cell--empty" style={{ width }} />
            }

            if (col.filterRenderer) {
              return (
                <div key={field} className="adg-header__filter-cell" style={{ width }}>
                  {col.filterRenderer({
                    colDef: col as ColDef,
                    field,
                    filterValue: filterModel[field],
                    setFilter: v => onFilterChange(field, v),
                    clearFilter: () => onFilterClear(field),
                  })}
                </div>
              )
            }

            const filterType = col.filterType ?? 'text'
            return (
              <div key={field} className="adg-header__filter-cell" style={{ width }}>
                {filterType === 'boolean' ? (
                  <select
                    className="adg-filter-input adg-filter-input--select"
                    value={String(filterModel[field] ?? '')}
                    onChange={e => {
                      const v = e.target.value
                      if (v === '') onFilterClear(field)
                      else onFilterChange(field, { field, operator: 'equals' as const, value: v === 'true' })
                    }}
                  >
                    <option value="">—</option>
                    <option value="true">Da</option>
                    <option value="false">Nu</option>
                  </select>
                ) : filterType === 'set' && col.filterOptions ? (
                  <select
                    className="adg-filter-input adg-filter-input--select"
                    value={String((filterModel[field] as unknown as { value?: unknown })?.value ?? '')}
                    onChange={e => {
                      const v = e.target.value
                      if (v === '') onFilterClear(field)
                      else onFilterChange(field, { field, operator: 'equals' as const, value: v })
                    }}
                  >
                    <option value="">—</option>
                    {col.filterOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={filterType === 'number' ? 'number' : filterType === 'date' ? 'date' : 'text'}
                    className="adg-filter-input"
                    placeholder="Filtrare..."
                    value={String((filterModel[field] as unknown as { value?: unknown })?.value ?? '')}
                    onChange={e => {
                      const v = e.target.value
                      if (v === '') onFilterClear(field)
                      else onFilterChange(field, {
                        field,
                        operator: filterType === 'number' ? 'equals' as const : 'contains' as const,
                        value: filterType === 'number' ? Number(v) : v,
                      })
                    }}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
