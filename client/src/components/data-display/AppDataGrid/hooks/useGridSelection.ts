import { useState, useCallback, useRef } from 'react'
import type {
  RowSelectionMode, CellPosition, CellRange, SelectionState,
  SelectionChangedEvent, GroupRow,
} from '../AppDataGrid.types'
import { isGroupRow } from '../AppDataGrid.types'

export interface UseGridSelectionOptions<T extends object> {
  rowSelection?: RowSelectionMode
  cellSelection?: boolean
  suppressRowDeselection?: boolean
  persistSelection?: boolean
  getRowId: (data: T) => string | number
  onSelectionChanged?: (event: SelectionChangedEvent<T>) => void
}

export interface UseGridSelectionReturn<T extends object> {
  selectionState: SelectionState<T>
  isRowSelected: (id: string | number) => boolean
  isCellSelected: (rowIndex: number, field: string) => boolean

  selectRow: (data: T, exclusive: boolean) => void
  selectRowRange: (rows: T[], fromId: string | number, toId: string | number) => void
  deselectRow: (data: T) => void
  toggleRow: (data: T, isCtrl: boolean, isShift: boolean, allRows: Array<T | GroupRow<T>>) => void
  selectAll: (rows: T[]) => void
  deselectAll: () => void
  selectRows: (ids: Array<string | number>, rows: T[]) => void

  selectCell: (pos: CellPosition) => void
  selectCellRange: (range: CellRange) => void
  clearCellSelection: () => void
}

export function useGridSelection<T extends object>(options: UseGridSelectionOptions<T>): UseGridSelectionReturn<T> {
  const { rowSelection, cellSelection, suppressRowDeselection, getRowId, onSelectionChanged } = options

  const [selectionState, setSelectionState] = useState<SelectionState<T>>({
    selectedRowIds: new Set(),
    selectedRows: [],
    selectedCells: [],
    cellRanges: [],
  })

  const lastSelectedRef = useRef<string | number | null>(null)

  const emitChange = useCallback((state: SelectionState<T>) => {
    onSelectionChanged?.({
      selectedRows: state.selectedRows,
      selectedRowIds: state.selectedRowIds,
    })
  }, [onSelectionChanged])

  const selectRow = useCallback((data: T, exclusive: boolean) => {
    if (!rowSelection) return

    setSelectionState(prev => {
      const id = getRowId(data)
      let next: SelectionState<T>

      if (exclusive || rowSelection === 'single') {
        next = {
          ...prev,
          selectedRowIds: new Set([id]),
          selectedRows: [data],
        }
      } else {
        const newIds = new Set(prev.selectedRowIds)
        newIds.add(id)
        next = {
          ...prev,
          selectedRowIds: newIds,
          selectedRows: [...prev.selectedRows.filter(r => getRowId(r) !== id), data],
        }
      }

      lastSelectedRef.current = id
      emitChange(next)
      return next
    })
  }, [rowSelection, getRowId, emitChange])

  const deselectRow = useCallback((data: T) => {
    if (!rowSelection) return
    if (suppressRowDeselection) return

    setSelectionState(prev => {
      const id = getRowId(data)
      const newIds = new Set(prev.selectedRowIds)
      newIds.delete(id)
      const next: SelectionState<T> = {
        ...prev,
        selectedRowIds: newIds,
        selectedRows: prev.selectedRows.filter(r => getRowId(r) !== id),
      }
      emitChange(next)
      return next
    })
  }, [rowSelection, suppressRowDeselection, getRowId, emitChange])

  const selectRowRange = useCallback((rows: T[], fromId: string | number, toId: string | number) => {
    if (!rowSelection || rowSelection === 'single') return

    const fromIdx = rows.findIndex(r => getRowId(r) === fromId)
    const toIdx = rows.findIndex(r => getRowId(r) === toId)
    if (fromIdx === -1 || toIdx === -1) return

    const start = Math.min(fromIdx, toIdx)
    const end = Math.max(fromIdx, toIdx)
    const rangeRows = rows.slice(start, end + 1)

    setSelectionState(prev => {
      const newIds = new Set(prev.selectedRowIds)
      for (const r of rangeRows) newIds.add(getRowId(r))
      const allSelected = [...prev.selectedRows.filter(r => !rangeRows.some(rr => getRowId(rr) === getRowId(r))), ...rangeRows]
      const next: SelectionState<T> = {
        ...prev,
        selectedRowIds: newIds,
        selectedRows: allSelected,
      }
      emitChange(next)
      return next
    })
  }, [rowSelection, getRowId, emitChange])

  const toggleRow = useCallback((data: T, isCtrl: boolean, isShift: boolean, allRows: Array<T | GroupRow<T>>) => {
    if (!rowSelection) return

    const id = getRowId(data)

    if (isShift && rowSelection === 'multiple' && lastSelectedRef.current !== null) {
      const flatRows = allRows.filter(r => !isGroupRow(r)) as T[]
      selectRowRange(flatRows, lastSelectedRef.current, id)
      return
    }

    if (rowSelection === 'single' || (!isCtrl && rowSelection === 'multiple')) {
      // Exclusive select
      if (selectionState.selectedRowIds.has(id) && selectionState.selectedRowIds.size === 1 && !suppressRowDeselection) {
        deselectRow(data)
      } else {
        selectRow(data, true)
      }
      return
    }

    // Ctrl + click (multiple)
    if (selectionState.selectedRowIds.has(id)) {
      deselectRow(data)
    } else {
      selectRow(data, false)
    }
  }, [rowSelection, getRowId, selectionState, suppressRowDeselection, selectRow, deselectRow, selectRowRange])

  const selectAll = useCallback((rows: T[]) => {
    if (!rowSelection || rowSelection === 'single') return
    const ids = new Set(rows.map(r => getRowId(r)))
    const next: SelectionState<T> = {
      selectedRowIds: ids,
      selectedRows: [...rows],
      selectedCells: [],
      cellRanges: [],
    }
    setSelectionState(next)
    emitChange(next)
  }, [rowSelection, getRowId, emitChange])

  const deselectAll = useCallback(() => {
    const next: SelectionState<T> = {
      selectedRowIds: new Set(),
      selectedRows: [],
      selectedCells: [],
      cellRanges: [],
    }
    setSelectionState(next)
    emitChange(next)
  }, [emitChange])

  const selectRows = useCallback((ids: Array<string | number>, rows: T[]) => {
    if (!rowSelection) return
    const idSet = new Set(ids)
    const selected = rows.filter(r => idSet.has(getRowId(r)))
    const next: SelectionState<T> = {
      selectedRowIds: idSet,
      selectedRows: selected,
      selectedCells: [],
      cellRanges: [],
    }
    setSelectionState(next)
    emitChange(next)
  }, [rowSelection, getRowId, emitChange])

  // ── Cell selection ────────────────────────────────────────────────────────

  const selectCell = useCallback((pos: CellPosition) => {
    if (!cellSelection) return
    setSelectionState(prev => ({
      ...prev,
      selectedCells: [pos],
      cellRanges: [],
    }))
  }, [cellSelection])

  const selectCellRange = useCallback((range: CellRange) => {
    if (!cellSelection) return
    setSelectionState(prev => ({
      ...prev,
      cellRanges: [range],
    }))
  }, [cellSelection])

  const clearCellSelection = useCallback(() => {
    setSelectionState(prev => ({
      ...prev,
      selectedCells: [],
      cellRanges: [],
    }))
  }, [])

  const isRowSelected = useCallback((id: string | number) => {
    return selectionState.selectedRowIds.has(id)
  }, [selectionState.selectedRowIds])

  const isCellSelected = useCallback((rowIndex: number, field: string) => {
    return selectionState.selectedCells.some(c => c.rowIndex === rowIndex && c.field === field)
  }, [selectionState.selectedCells])

  return {
    selectionState,
    isRowSelected,
    isCellSelected,
    selectRow,
    selectRowRange,
    deselectRow,
    toggleRow,
    selectAll,
    deselectAll,
    selectRows,
    selectCell,
    selectCellRange,
    clearCellSelection,
  }
}
