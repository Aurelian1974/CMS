import { useCallback } from 'react'
import type { CellPosition, ColDef } from '../AppDataGrid.types'
import { getColField } from '../AppDataGrid.types'

export interface UseGridKeyboardOptions<T extends object> {
  containerRef: React.RefObject<HTMLElement | null>
  visibleColumns: ColDef<T>[]
  totalRows: number
  focusedCell: CellPosition | null
  setFocusedCell: (pos: CellPosition | null) => void

  // Actions
  onStartEdit?: (rowIndex: number, field: string) => void
  onStopEdit?: (cancel?: boolean) => void
  onCopy?: () => void
  onPaste?: () => void
  onUndo?: () => void
  onRedo?: () => void
  onSelectAll?: () => void
  onDelete?: () => void
  isEditing: boolean
  enabled?: boolean
}

export interface UseGridKeyboardReturn {
  handleKeyDown: (e: React.KeyboardEvent) => void
  focusedCell: CellPosition | null
  setFocusedCell: (pos: CellPosition | null) => void
}

export function useGridKeyboard<T extends object>(options: UseGridKeyboardOptions<T>): UseGridKeyboardReturn {
  const {
    containerRef: _containerRef,
    visibleColumns,
    totalRows,
    focusedCell,
    setFocusedCell,
    onStartEdit,
    onStopEdit,
    onCopy,
    onPaste,
    onUndo,
    onRedo,
    onSelectAll,
    onDelete,
    isEditing,
    enabled = true,
  } = options

  const fields = visibleColumns.map(c => getColField(c)).filter(Boolean)

  const moveFocus = useCallback((dRow: number, dCol: number) => {
    if (!focusedCell) {
      setFocusedCell({ rowIndex: 0, field: fields[0] ?? '' })
      return
    }

    const colIdx = fields.indexOf(focusedCell.field)
    const newRow = Math.max(0, Math.min(totalRows - 1, focusedCell.rowIndex + dRow))
    const newCol = Math.max(0, Math.min(fields.length - 1, colIdx + dCol))

    setFocusedCell({ rowIndex: newRow, field: fields[newCol] })
  }, [focusedCell, setFocusedCell, fields, totalRows])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!enabled) return

    const isCtrl = e.ctrlKey || e.metaKey

    // ── Editing mode shortcuts ──────────────────────────────────────────────
    if (isEditing) {
      if (e.key === 'Escape') {
        e.preventDefault()
        onStopEdit?.(true)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        onStopEdit?.(false)
        // Move down after save
        moveFocus(1, 0)
        return
      }
      if (e.key === 'Tab') {
        e.preventDefault()
        onStopEdit?.(false)
        moveFocus(0, e.shiftKey ? -1 : 1)
        return
      }
      return // Don't handle other keys while editing
    }

    // ── Navigation ──────────────────────────────────────────────────────────
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault()
        moveFocus(-1, 0)
        break
      case 'ArrowDown':
        e.preventDefault()
        moveFocus(1, 0)
        break
      case 'ArrowLeft':
        e.preventDefault()
        moveFocus(0, -1)
        break
      case 'ArrowRight':
        e.preventDefault()
        moveFocus(0, 1)
        break
      case 'Tab':
        e.preventDefault()
        moveFocus(0, e.shiftKey ? -1 : 1)
        break
      case 'Home':
        e.preventDefault()
        if (isCtrl) {
          setFocusedCell({ rowIndex: 0, field: fields[0] ?? '' })
        } else {
          setFocusedCell({ rowIndex: focusedCell?.rowIndex ?? 0, field: fields[0] ?? '' })
        }
        break
      case 'End':
        e.preventDefault()
        if (isCtrl) {
          setFocusedCell({ rowIndex: totalRows - 1, field: fields[fields.length - 1] ?? '' })
        } else {
          setFocusedCell({ rowIndex: focusedCell?.rowIndex ?? 0, field: fields[fields.length - 1] ?? '' })
        }
        break
      case 'PageUp':
        e.preventDefault()
        moveFocus(-10, 0)
        break
      case 'PageDown':
        e.preventDefault()
        moveFocus(10, 0)
        break

      // ── Edit ──────────────────────────────────────────────────────────────
      case 'Enter':
      case 'F2':
        e.preventDefault()
        if (focusedCell) {
          onStartEdit?.(focusedCell.rowIndex, focusedCell.field)
        }
        break

      // ── Clipboard ─────────────────────────────────────────────────────────
      case 'c':
        if (isCtrl) {
          e.preventDefault()
          onCopy?.()
        }
        break
      case 'v':
        if (isCtrl) {
          e.preventDefault()
          onPaste?.()
        }
        break

      // ── Undo/Redo ─────────────────────────────────────────────────────────
      case 'z':
        if (isCtrl) {
          e.preventDefault()
          if (e.shiftKey) onRedo?.()
          else onUndo?.()
        }
        break
      case 'y':
        if (isCtrl) {
          e.preventDefault()
          onRedo?.()
        }
        break

      // ── Select All ────────────────────────────────────────────────────────
      case 'a':
        if (isCtrl) {
          e.preventDefault()
          onSelectAll?.()
        }
        break

      // ── Delete ────────────────────────────────────────────────────────────
      case 'Delete':
        e.preventDefault()
        onDelete?.()
        break
    }
  }, [enabled, isEditing, moveFocus, focusedCell, setFocusedCell, fields, totalRows,
      onStartEdit, onStopEdit, onCopy, onPaste, onUndo, onRedo, onSelectAll, onDelete])

  return {
    handleKeyDown,
    focusedCell,
    setFocusedCell,
  }
}
