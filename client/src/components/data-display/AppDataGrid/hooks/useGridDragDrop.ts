import { useState, useCallback, useRef } from 'react'
import type { RowDragEndEvent } from '../AppDataGrid.types'

export interface UseGridDragDropOptions<T extends object> {
  enabled?: boolean
  entireRow?: boolean
  onRowDragEnd?: (event: RowDragEndEvent<T>) => void
}

export interface UseGridDragDropReturn<T extends object> {
  dragState: DragState | null
  handleDragStart: (rowIndex: number, data: T, e: React.DragEvent) => void
  handleDragOver: (rowIndex: number, e: React.DragEvent) => void
  handleDragEnd: (e: React.DragEvent) => void
  handleDrop: (rowIndex: number, rows: T[], setRowData: (data: T[]) => void) => void
  isDragging: boolean
  dropTargetIndex: number | null

  // Column drag
  columnDragState: ColumnDragState | null
  handleColumnDragStart: (field: string, e: React.DragEvent) => void
  handleColumnDragOver: (field: string, e: React.DragEvent) => void
  handleColumnDrop: (targetField: string, onReorder: (from: number, to: number) => void, columnOrder: string[]) => void
  handleColumnDragEnd: () => void
}

interface DragState {
  rowIndex: number
  data: unknown
}

interface ColumnDragState {
  field: string
}

export function useGridDragDrop<T extends object>(options: UseGridDragDropOptions<T>): UseGridDragDropReturn<T> {
  const { enabled = false, onRowDragEnd } = options

  const [dragState, setDragState] = useState<DragState | null>(null)
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null)
  const [columnDragState, setColumnDragState] = useState<ColumnDragState | null>(null)

  // ── Row Drag ──────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((rowIndex: number, data: T, e: React.DragEvent) => {
    if (!enabled) return
    setDragState({ rowIndex, data })
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(rowIndex))
  }, [enabled])

  const handleDragOver = useCallback((rowIndex: number, e: React.DragEvent) => {
    if (!enabled || !dragState) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropTargetIndex(rowIndex)
  }, [enabled, dragState])

  const handleDrop = useCallback((rowIndex: number, rows: T[], setRowData: (data: T[]) => void) => {
    if (!dragState) return

    const fromIndex = dragState.rowIndex
    const toIndex = rowIndex

    if (fromIndex === toIndex) {
      setDragState(null)
      setDropTargetIndex(null)
      return
    }

    const newData = [...rows]
    const [moved] = newData.splice(fromIndex, 1)
    newData.splice(toIndex, 0, moved)
    setRowData(newData)

    onRowDragEnd?.({
      data: dragState.data as T,
      fromIndex,
      toIndex,
    })

    setDragState(null)
    setDropTargetIndex(null)
  }, [dragState, onRowDragEnd])

  const handleDragEnd = useCallback(() => {
    setDragState(null)
    setDropTargetIndex(null)
  }, [])

  // ── Column Drag ───────────────────────────────────────────────────────────

  const handleColumnDragStart = useCallback((field: string, e: React.DragEvent) => {
    setColumnDragState({ field })
    e.dataTransfer.effectAllowed = 'copyMove'
    e.dataTransfer.setData('text/column-field', field)
    e.dataTransfer.setData('text/plain', field)
  }, [])

  const handleColumnDragOver = useCallback((field: string, e: React.DragEvent) => {
    if (!columnDragState) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [columnDragState])

  const handleColumnDrop = useCallback((
    targetField: string,
    onReorder: (from: number, to: number) => void,
    columnOrder: string[],
  ) => {
    if (!columnDragState) return

    const fromIndex = columnOrder.indexOf(columnDragState.field)
    const toIndex = columnOrder.indexOf(targetField)

    if (fromIndex !== -1 && toIndex !== -1 && fromIndex !== toIndex) {
      onReorder(fromIndex, toIndex)
    }

    setColumnDragState(null)
  }, [columnDragState])

  const handleColumnDragEnd = useCallback(() => {
    setColumnDragState(null)
  }, [])

  return {
    dragState,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    isDragging: dragState !== null,
    dropTargetIndex,

    columnDragState,
    handleColumnDragStart,
    handleColumnDragOver,
    handleColumnDrop,
    handleColumnDragEnd,
  }
}
