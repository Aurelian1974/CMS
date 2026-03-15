import { useState, useCallback, useRef, useEffect, useMemo } from 'react'

export interface UseGridVirtualizationOptions {
  totalRows: number
  rowHeight: number
  getRowHeight?: (index: number) => number
  overscanRows?: number
  enabled?: boolean
  containerHeight?: number
}

export interface UseGridVirtualizationReturn {
  visibleRange: { start: number; end: number }
  totalHeight: number
  offsetY: number
  scrollContainerRef: React.RefObject<HTMLDivElement | null>
  handleScroll: (e: React.UIEvent<HTMLDivElement>) => void
  scrollToRow: (index: number) => void
  isVirtualized: boolean
}

export function useGridVirtualization(options: UseGridVirtualizationOptions): UseGridVirtualizationReturn {
  const {
    totalRows,
    rowHeight,
    getRowHeight,
    overscanRows = 5,
    enabled = true,
  } = options

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(options.containerHeight ?? 600)

  const isVirtualized = enabled && totalRows > 50

  // ── Observe container height ──────────────────────────────────────────────
  useEffect(() => {
    if (!scrollContainerRef.current || !isVirtualized) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    observer.observe(scrollContainerRef.current)
    return () => observer.disconnect()
  }, [isVirtualized])

  // ── Row positions (for variable heights) ──────────────────────────────────
  const rowPositions = useMemo(() => {
    if (!isVirtualized || !getRowHeight) return null
    const positions = new Float64Array(totalRows + 1)
    for (let i = 0; i < totalRows; i++) {
      positions[i + 1] = positions[i] + getRowHeight(i)
    }
    return positions
  }, [totalRows, getRowHeight, isVirtualized])

  // ── Total height ──────────────────────────────────────────────────────────
  const totalHeight = useMemo(() => {
    if (!isVirtualized) return totalRows * rowHeight
    if (rowPositions) return rowPositions[totalRows]
    return totalRows * rowHeight
  }, [totalRows, rowHeight, isVirtualized, rowPositions])

  // ── Visible range ─────────────────────────────────────────────────────────
  const visibleRange = useMemo(() => {
    if (!isVirtualized) return { start: 0, end: totalRows }

    let startRow: number
    let endRow: number

    if (rowPositions) {
      // Binary search for start row
      startRow = binarySearch(rowPositions, scrollTop)
      endRow = binarySearch(rowPositions, scrollTop + containerHeight) + 1
    } else {
      startRow = Math.floor(scrollTop / rowHeight)
      endRow = Math.ceil((scrollTop + containerHeight) / rowHeight)
    }

    startRow = Math.max(0, startRow - overscanRows)
    endRow = Math.min(totalRows, endRow + overscanRows)

    return { start: startRow, end: endRow }
  }, [scrollTop, containerHeight, totalRows, rowHeight, overscanRows, isVirtualized, rowPositions])

  // ── Offset Y (top padding for virtualized rows) ──────────────────────────
  const offsetY = useMemo(() => {
    if (!isVirtualized) return 0
    if (rowPositions) return rowPositions[visibleRange.start]
    return visibleRange.start * rowHeight
  }, [isVirtualized, visibleRange.start, rowHeight, rowPositions])

  // ── Scroll handler ────────────────────────────────────────────────────────
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    setScrollTop(target.scrollTop)
  }, [])

  // ── Scroll to row ─────────────────────────────────────────────────────────
  const scrollToRow = useCallback((index: number) => {
    if (!scrollContainerRef.current) return
    const top = rowPositions ? rowPositions[index] : index * rowHeight
    scrollContainerRef.current.scrollTop = top
  }, [rowHeight, rowPositions])

  return {
    visibleRange,
    totalHeight,
    offsetY,
    scrollContainerRef,
    handleScroll,
    scrollToRow,
    isVirtualized,
  }
}

/** Binary search în array sortat — returnează indexul rândului la poziția dată. */
function binarySearch(positions: Float64Array, target: number): number {
  let lo = 0
  let hi = positions.length - 1
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (positions[mid] < target) lo = mid + 1
    else hi = mid
  }
  return Math.max(0, lo - 1)
}
