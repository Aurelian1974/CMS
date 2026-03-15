import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import type { ColDef, ColumnPinned, ColumnResizedEvent, ColumnReorderedEvent, ColumnVisibilityChangedEvent } from '../AppDataGrid.types'
import { getColField } from '../AppDataGrid.types'
import { applyDefaultColDef, applyColumnTypes, distributeFlexWidths, autoSizeColumnWidth, getVisibleColumns } from '../utils/columnUtils'
import { flattenColumns } from '../utils/aggregateUtils'
import type { ColumnTypes } from '../AppDataGrid.types'

export interface UseGridColumnsOptions<T extends object> {
  columnDefs: ColDef<T>[]
  defaultColDef?: Partial<ColDef<T>>
  columnTypes?: ColumnTypes<T>
  onColumnResized?: (event: ColumnResizedEvent) => void
  onColumnReordered?: (event: ColumnReorderedEvent) => void
  onColumnVisibilityChanged?: (event: ColumnVisibilityChangedEvent) => void
}

export interface UseGridColumnsReturn<T extends object> {
  processedColumnDefs: ColDef<T>[]
  columnOrder: string[]
  columnWidths: Map<string, number>
  hiddenColumns: Set<string>
  pinnedColumns: Map<string, ColumnPinned>
  visibleColumns: { left: ColDef<T>[]; center: ColDef<T>[]; right: ColDef<T>[] }
  allVisibleColumns: ColDef<T>[]

  setColumnOrder: (order: string[]) => void
  setColumnWidth: (field: string, width: number) => void
  setColumnVisible: (field: string, visible: boolean) => void
  setColumnPinned: (field: string, pinned: ColumnPinned) => void
  autoSizeColumn: (field: string, rows: T[]) => void
  autoSizeAllColumns: (rows: T[]) => void
  moveColumn: (fromIndex: number, toIndex: number) => void
  startResize: (field: string, startX: number) => void
  containerRef: React.RefObject<HTMLDivElement | null>
}

export function useGridColumns<T extends object>(options: UseGridColumnsOptions<T>): UseGridColumnsReturn<T> {
  const { columnDefs, defaultColDef, columnTypes, onColumnResized, onColumnReordered, onColumnVisibilityChanged } = options

  // ── Procesare coloane (merge defaults + types) ────────────────────────────
  const processedColumnDefs = useMemo(() => {
    let cols = applyColumnTypes(columnDefs, columnTypes)
    cols = applyDefaultColDef(cols, defaultColDef)
    return cols
  }, [columnDefs, defaultColDef, columnTypes])

  const flat = useMemo(() => flattenColumns(processedColumnDefs), [processedColumnDefs])

  // ── State ──────────────────────────────────────────────────────────────────
  const [columnOrder, setColumnOrder] = useState<string[]>(() =>
    flat.map(c => getColField(c)).filter(Boolean)
  )
  const [columnWidths, setColumnWidths] = useState<Map<string, number>>(() => {
    const m = new Map<string, number>()
    for (const col of flat) {
      const f = getColField(col)
      if (f) m.set(f, col.width ?? col.minWidth ?? 150)
    }
    return m
  })
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(() => {
    const s = new Set<string>()
    for (const col of flat) {
      if (col.hide) s.add(getColField(col))
    }
    return s
  })
  const [pinnedColumns, setPinnedColumns] = useState<Map<string, ColumnPinned>>(() => {
    const m = new Map<string, ColumnPinned>()
    for (const col of flat) {
      if (col.pinned) m.set(getColField(col), col.pinned)
    }
    return m
  })

  const containerRef = useRef<HTMLDivElement>(null)
  const resizeRef = useRef<{ field: string; startX: number; startWidth: number } | null>(null)

  // Sync cu columnDefs changes
  useEffect(() => {
    const newFlat = flattenColumns(applyDefaultColDef(applyColumnTypes(columnDefs, columnTypes), defaultColDef))
    const newFields = newFlat.map(c => getColField(c)).filter(Boolean)

    setColumnOrder(prev => {
      const existing = new Set(prev)
      const result = [...prev.filter(f => newFields.includes(f))]
      for (const f of newFields) {
        if (!existing.has(f)) result.push(f)
      }
      return result
    })

    setColumnWidths(prev => {
      const next = new Map(prev)
      for (const col of newFlat) {
        const f = getColField(col)
        if (f && !next.has(f)) {
          next.set(f, col.width ?? col.minWidth ?? 150)
        }
      }
      return next
    })
  }, [columnDefs, defaultColDef, columnTypes])

  // ── Flex distribution ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const width = entry.contentRect.width
        setColumnWidths(prev => distributeFlexWidths(processedColumnDefs, prev, width))
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [processedColumnDefs])

  // ── Visible columns ───────────────────────────────────────────────────────
  const visibleColumns = useMemo(() =>
    getVisibleColumns(processedColumnDefs, columnOrder, hiddenColumns, pinnedColumns),
    [processedColumnDefs, columnOrder, hiddenColumns, pinnedColumns]
  )

  const allVisibleColumns = useMemo(() =>
    [...visibleColumns.left, ...visibleColumns.center, ...visibleColumns.right],
    [visibleColumns]
  )

  // ── Actions ───────────────────────────────────────────────────────────────

  const setColumnWidth = useCallback((field: string, width: number) => {
    const col = flat.find(c => getColField(c) === field)
    let w = width
    if (col?.minWidth) w = Math.max(w, col.minWidth)
    if (col?.maxWidth) w = Math.min(w, col.maxWidth)

    setColumnWidths(prev => {
      const oldWidth = prev.get(field) ?? 150
      if (oldWidth !== w) {
        onColumnResized?.({ field, newWidth: w, oldWidth })
      }
      return new Map(prev).set(field, w)
    })
  }, [flat, onColumnResized])

  const setColumnVisible = useCallback((field: string, visible: boolean) => {
    setHiddenColumns(prev => {
      const next = new Set(prev)
      if (visible) next.delete(field)
      else next.add(field)
      return next
    })
    onColumnVisibilityChanged?.({ field, visible })
  }, [onColumnVisibilityChanged])

  const setColumnPinned = useCallback((field: string, pinned: ColumnPinned) => {
    setPinnedColumns(prev => {
      const next = new Map(prev)
      if (pinned === false) next.delete(field)
      else next.set(field, pinned)
      return next
    })
  }, [])

  const moveColumn = useCallback((fromIndex: number, toIndex: number) => {
    setColumnOrder(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      onColumnReordered?.({ field: moved, fromIndex, toIndex })
      return next
    })
  }, [onColumnReordered])

  const autoSizeCol = useCallback((field: string, rows: T[]) => {
    const col = flat.find(c => getColField(c) === field)
    if (!col) return
    const width = autoSizeColumnWidth(field, rows, col.headerName ?? field)
    setColumnWidth(field, width)
  }, [flat, setColumnWidth])

  const autoSizeAllCols = useCallback((rows: T[]) => {
    for (const col of flat) {
      const f = getColField(col)
      if (f && !hiddenColumns.has(f)) {
        autoSizeCol(f, rows)
      }
    }
  }, [flat, hiddenColumns, autoSizeCol])

  const columnWidthsRef = useRef(columnWidths)
  columnWidthsRef.current = columnWidths

  // ── Resize via mouse ──────────────────────────────────────────────────────
  const startResize = useCallback((field: string, startX: number) => {
    const currentWidth = columnWidthsRef.current.get(field) ?? 150
    resizeRef.current = { field, startX, startWidth: currentWidth }

    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeRef.current) return
      const diff = e.clientX - resizeRef.current.startX
      const newWidth = Math.max(50, resizeRef.current.startWidth + diff)
      setColumnWidth(resizeRef.current.field, newWidth)
    }

    const handleMouseUp = () => {
      resizeRef.current = null
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [setColumnWidth])

  return {
    processedColumnDefs,
    columnOrder,
    columnWidths,
    hiddenColumns,
    pinnedColumns,
    visibleColumns,
    allVisibleColumns,

    setColumnOrder,
    setColumnWidth,
    setColumnVisible,
    setColumnPinned,
    autoSizeColumn: autoSizeCol,
    autoSizeAllColumns: autoSizeAllCols,
    moveColumn,
    startResize,
    containerRef,
  }
}
