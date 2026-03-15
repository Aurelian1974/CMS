import { useState, useCallback, useRef } from 'react'
import type {
  EditMode, EditingCell, EditChange, BatchChange,
  ColDef, CellParams, EditStartedEvent, EditEndedEvent,
} from '../AppDataGrid.types'
import { getColField, getNestedValue, setNestedValue } from '../AppDataGrid.types'

export interface UseGridEditOptions<T extends object> {
  editable?: boolean
  editMode?: EditMode
  singleClickEdit?: boolean
  undoRedoEditing?: boolean
  stopEditingWhenLoseFocus?: boolean
  columnDefs: ColDef<T>[]
  getRowId: (data: T) => string | number
  onEditStarted?: (event: EditStartedEvent<T>) => void
  onEditEnded?: (event: EditEndedEvent<T>) => void
  onRowDataUpdated?: (data: T[]) => void
}

export interface UseGridEditReturn<T extends object> {
  editingCell: EditingCell | null
  dirtyMap: Map<string, EditChange<T>>
  batchChanges: BatchChange<T>

  startEditing: (rowIndex: number, field: string, data: T) => void
  stopEditing: (cancel?: boolean) => void
  setEditValue: (value: unknown) => void
  applyEdit: (rowData: T[], setRowData: (data: T[]) => void) => void

  undo: (rowData: T[], setRowData: (data: T[]) => void) => void
  redo: (rowData: T[], setRowData: (data: T[]) => void) => void
  canUndo: boolean
  canRedo: boolean

  addRow: (row: T) => void
  deleteRow: (rowId: string | number) => void
  commitBatch: (rowData: T[], setRowData: (data: T[]) => void) => void
  discardBatch: () => void

  isCellEditable: (colDef: ColDef<T>, data: T, rowIndex: number) => boolean
  isDirty: (rowIndex: number, field: string) => boolean
  getValidationError: (colDef: ColDef<T>, value: unknown, data: T, rowIndex: number) => string | null
}

export function useGridEdit<T extends object>(options: UseGridEditOptions<T>): UseGridEditReturn<T> {
  const {
    editable = false,
    editMode = 'cell',
    undoRedoEditing = true,
    columnDefs,
    getRowId,
    onEditStarted,
    onEditEnded,
    onRowDataUpdated,
  } = options

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null)
  const [dirtyMap, setDirtyMap] = useState<Map<string, EditChange<T>>>(new Map())
  const [batchChanges, setBatchChanges] = useState<BatchChange<T>>({ added: [], updated: [], deleted: [] })

  // Undo/Redo stacks
  const undoStack = useRef<EditChange<T>[]>([])
  const redoStack = useRef<EditChange<T>[]>([])
  const [canUndo, setCanUndo] = useState(false)
  const [canRedo, setCanRedo] = useState(false)

  const editValueRef = useRef<unknown>(null)

  const isCellEditable = useCallback((colDef: ColDef<T>, data: T, rowIndex: number): boolean => {
    if (!editable) return false
    if (colDef.editable === undefined) return true
    if (typeof colDef.editable === 'function') {
      return colDef.editable({
        value: getNestedValue(data, getColField(colDef)),
        data,
        colDef,
        rowIndex,
        field: getColField(colDef),
        api: null as unknown as CellParams<T>['api'],
      })
    }
    return colDef.editable
  }, [editable])

  const getValidationError = useCallback((
    colDef: ColDef<T>,
    value: unknown,
    data: T,
    rowIndex: number,
  ): string | null => {
    if (!colDef.validator) return null
    return colDef.validator({
      value,
      data,
      colDef,
      rowIndex,
      field: getColField(colDef),
      api: null as unknown as CellParams<T>['api'],
    })
  }, [])

  const startEditing = useCallback((rowIndex: number, field: string, data: T) => {
    if (!editable) return
    const col = columnDefs.find(c => getColField(c) === field)
    if (!col || !isCellEditable(col, data, rowIndex)) return

    const value = getNestedValue(data, field)
    const cell: EditingCell = { rowIndex, field, value, originalValue: value }
    setEditingCell(cell)
    editValueRef.current = value

    onEditStarted?.({ data, field, rowIndex, value })
  }, [editable, columnDefs, isCellEditable, onEditStarted])

  const setEditValue = useCallback((value: unknown) => {
    editValueRef.current = value
    setEditingCell(prev => prev ? { ...prev, value } : null)
  }, [])

  const stopEditing = useCallback((cancel?: boolean) => {
    setEditingCell(prev => {
      if (!prev) return null

      const cancelled = cancel === true
      if (!cancelled && editValueRef.current !== prev.originalValue) {
        // Will be applied via applyEdit
      }

      return null
    })
  }, [])

  const applyEdit = useCallback((rowData: T[], setRowData: (data: T[]) => void) => {
    if (!editingCell) return
    const newValue = editValueRef.current
    if (newValue === editingCell.originalValue) {
      setEditingCell(null)
      return
    }

    const col = columnDefs.find(c => getColField(c) === editingCell.field)
    if (!col) return

    // Validation
    const error = getValidationError(col, newValue, rowData[editingCell.rowIndex], editingCell.rowIndex)
    if (error) return // Don't close editor if validation fails

    const change: EditChange<T> = {
      rowIndex: editingCell.rowIndex,
      field: editingCell.field,
      data: rowData[editingCell.rowIndex],
      oldValue: editingCell.originalValue,
      newValue,
      timestamp: Date.now(),
    }

    if (editMode === 'batch') {
      // Accumulate in batch
      setBatchChanges(prev => ({
        ...prev,
        updated: [...prev.updated, change],
      }))
      const key = `${editingCell.rowIndex}:${editingCell.field}`
      setDirtyMap(prev => new Map(prev).set(key, change))
    } else {
      // Apply immediately
      const newData = [...rowData]
      const newRow = { ...newData[editingCell.rowIndex] }

      if (col.valueSetter) {
        col.valueSetter({
          data: newRow,
          colDef: col,
          field: editingCell.field,
          oldValue: editingCell.originalValue,
          newValue,
        })
      } else {
        setNestedValue(newRow, editingCell.field, newValue)
      }

      newData[editingCell.rowIndex] = newRow
      setRowData(newData)
      onRowDataUpdated?.(newData)

      // Undo stack
      if (undoRedoEditing) {
        undoStack.current.push(change)
        redoStack.current = []
        setCanUndo(true)
        setCanRedo(false)
      }
    }

    onEditEnded?.({
      data: rowData[editingCell.rowIndex],
      field: editingCell.field,
      rowIndex: editingCell.rowIndex,
      oldValue: editingCell.originalValue,
      newValue,
      cancelled: false,
    })

    setEditingCell(null)
  }, [editingCell, editMode, columnDefs, getValidationError, undoRedoEditing, onEditEnded, onRowDataUpdated])

  const undo = useCallback((rowData: T[], setRowData: (data: T[]) => void) => {
    if (!undoStack.current.length) return
    const change = undoStack.current.pop()!
    redoStack.current.push(change)

    const newData = [...rowData]
    const newRow = { ...newData[change.rowIndex] }
    setNestedValue(newRow, change.field, change.oldValue)
    newData[change.rowIndex] = newRow
    setRowData(newData)
    onRowDataUpdated?.(newData)

    setCanUndo(undoStack.current.length > 0)
    setCanRedo(true)
  }, [onRowDataUpdated])

  const redo = useCallback((rowData: T[], setRowData: (data: T[]) => void) => {
    if (!redoStack.current.length) return
    const change = redoStack.current.pop()!
    undoStack.current.push(change)

    const newData = [...rowData]
    const newRow = { ...newData[change.rowIndex] }
    setNestedValue(newRow, change.field, change.newValue)
    newData[change.rowIndex] = newRow
    setRowData(newData)
    onRowDataUpdated?.(newData)

    setCanRedo(redoStack.current.length > 0)
    setCanUndo(true)
  }, [onRowDataUpdated])

  const addRow = useCallback((row: T) => {
    setBatchChanges(prev => ({ ...prev, added: [...prev.added, row] }))
  }, [])

  const deleteRow = useCallback((rowId: string | number) => {
    setBatchChanges(prev => ({
      ...prev,
      deleted: [...prev.deleted, { id: rowId } as unknown as T],
    }))
  }, [])

  const commitBatch = useCallback((rowData: T[], setRowData: (data: T[]) => void) => {
    let newData = [...rowData]

    // Apply updates
    for (const change of batchChanges.updated) {
      const newRow = { ...newData[change.rowIndex] }
      setNestedValue(newRow, change.field, change.newValue)
      newData[change.rowIndex] = newRow
    }

    // Apply adds
    newData = [...newData, ...batchChanges.added]

    // Apply deletes
    const deleteIds = new Set(batchChanges.deleted.map(r => getRowId(r)))
    newData = newData.filter(r => !deleteIds.has(getRowId(r)))

    setRowData(newData)
    onRowDataUpdated?.(newData)
    setBatchChanges({ added: [], updated: [], deleted: [] })
    setDirtyMap(new Map())
  }, [batchChanges, getRowId, onRowDataUpdated])

  const discardBatch = useCallback(() => {
    setBatchChanges({ added: [], updated: [], deleted: [] })
    setDirtyMap(new Map())
  }, [])

  const isDirty = useCallback((rowIndex: number, field: string): boolean => {
    return dirtyMap.has(`${rowIndex}:${field}`)
  }, [dirtyMap])

  return {
    editingCell,
    dirtyMap,
    batchChanges,
    startEditing,
    stopEditing,
    setEditValue,
    applyEdit,
    undo,
    redo,
    canUndo,
    canRedo,
    addRow,
    deleteRow,
    commitBatch,
    discardBatch,
    isCellEditable,
    isDirty,
    getValidationError,
  }
}
