import React, { useRef, useEffect, useMemo } from 'react'
import type { ColDef, CellRendererParams, CellEditorParams } from '../AppDataGrid.types'
import { getColField, getNestedValue } from '../AppDataGrid.types'

export interface GridCellProps<T extends object> {
  data: T
  field: string
  colDef: ColDef<T>
  rowIndex: number
  width: number
  isEditing: boolean
  isFocused: boolean
  isDirty: boolean
  editValue?: unknown
  onClick: (e: React.MouseEvent) => void
  onDoubleClick: () => void
  onStartEdit: () => void
  onSetEditValue: (value: unknown) => void
  onStopEdit: (cancel?: boolean) => void
  onContextMenu?: (e: React.MouseEvent) => void
}

export function GridCell<T extends object>(props: GridCellProps<T>) {
  const {
    data, field, colDef, rowIndex, width,
    isEditing, isFocused, isDirty, editValue,
    onClick, onDoubleClick, onStartEdit,
    onSetEditValue, onStopEdit, onContextMenu,
  } = props

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null)

  // Obține valoarea raw
  const rawValue = useMemo(() => {
    if (colDef.valueGetter) {
      return colDef.valueGetter({ data, colDef, field, api: null as unknown as CellRendererParams<T>['api'] })
    }
    return getNestedValue(data, field)
  }, [data, field, colDef])

  // Formatare
  const formattedValue = useMemo(() => {
    if (colDef.valueFormatter) {
      return colDef.valueFormatter({ value: rawValue, data, colDef, field })
    }
    if (rawValue === null || rawValue === undefined) return ''
    if (rawValue instanceof Date) return rawValue.toLocaleDateString('ro-RO')
    if (typeof rawValue === 'boolean') return rawValue ? 'Da' : 'Nu'
    return String(rawValue)
  }, [rawValue, data, colDef, field])

  // Cell style
  const cellStyle = useMemo(() => {
    const base: React.CSSProperties = { width, minWidth: colDef.minWidth, maxWidth: colDef.maxWidth }
    if (typeof colDef.cellStyle === 'function') {
      Object.assign(base, colDef.cellStyle({
        value: rawValue, data, colDef, rowIndex, field,
        api: null as unknown as CellRendererParams<T>['api'],
      }))
    } else if (colDef.cellStyle) {
      Object.assign(base, colDef.cellStyle)
    }
    return base
  }, [width, colDef, rawValue, data, rowIndex, field])

  // Cell class
  const cellClass = useMemo(() => {
    const classes = ['adg-cell']
    if (isFocused) classes.push('adg-cell--focused')
    if (isDirty) classes.push('adg-cell--dirty')
    if (isEditing) classes.push('adg-cell--editing')
    if (colDef.ellipsis !== false) classes.push('adg-cell--ellipsis')
    if (colDef.wrapText) classes.push('adg-cell--wrap')

    if (typeof colDef.cellClass === 'function') {
      classes.push(colDef.cellClass({
        value: rawValue, data, colDef, rowIndex, field,
        api: null as unknown as CellRendererParams<T>['api'],
      }))
    } else if (typeof colDef.cellClass === 'string') {
      classes.push(colDef.cellClass)
    }

    if (colDef.cellClassRules) {
      for (const [cls, fn] of Object.entries(colDef.cellClassRules)) {
        if (fn({ value: rawValue, data, colDef, rowIndex, field, api: null as unknown as CellRendererParams<T>['api'] })) {
          classes.push(cls)
        }
      }
    }

    return classes.filter(Boolean).join(' ')
  }, [isFocused, isDirty, isEditing, colDef, rawValue, data, rowIndex, field])

  // Auto-focus the editor input
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if ('select' in inputRef.current && inputRef.current.type !== 'checkbox') {
        (inputRef.current as HTMLInputElement).select?.()
      }
    }
  }, [isEditing])

  // ── RENDER EDITING ────────────────────────────────────────────────────────
  if (isEditing) {
    // Custom editor
    if (colDef.cellEditor) {
      return (
        <div className={cellClass} style={cellStyle} role="gridcell">
          {colDef.cellEditor({
            value: editValue ?? rawValue,
            data,
            colDef,
            rowIndex,
            field,
            api: null as unknown as CellEditorParams<T>['api'],
            stopEditing: (cancel?: boolean) => onStopEdit(cancel),
            currentValue: editValue ?? rawValue,
            setValue: onSetEditValue,
          })}
        </div>
      )
    }

    // Built-in editors
    const editType = colDef.editType ?? 'text'

    return (
      <div className={cellClass} style={cellStyle} role="gridcell">
        {editType === 'select' ? (
          <select
            ref={inputRef as React.RefObject<HTMLSelectElement>}
            className="adg-cell__editor adg-cell__editor--select"
            value={String(editValue ?? rawValue ?? '')}
            onChange={e => onSetEditValue(e.target.value)}
            onBlur={() => onStopEdit(false)}
            onKeyDown={e => {
              if (e.key === 'Escape') onStopEdit(true)
              if (e.key === 'Enter') onStopEdit(false)
            }}
          >
            {colDef.editOptions?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        ) : editType === 'checkbox' ? (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="checkbox"
            className="adg-cell__editor adg-cell__editor--checkbox"
            checked={Boolean(editValue ?? rawValue)}
            onChange={e => {
              onSetEditValue(e.target.checked)
              onStopEdit(false)
            }}
          />
        ) : editType === 'textarea' ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className="adg-cell__editor adg-cell__editor--textarea"
            value={String(editValue ?? rawValue ?? '')}
            onChange={e => onSetEditValue(e.target.value)}
            onBlur={() => onStopEdit(false)}
            onKeyDown={e => {
              if (e.key === 'Escape') onStopEdit(true)
            }}
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type={editType === 'number' ? 'number' : editType === 'date' ? 'date' : 'text'}
            className="adg-cell__editor"
            value={String(editValue ?? rawValue ?? '')}
            onChange={e => onSetEditValue(editType === 'number' ? Number(e.target.value) : e.target.value)}
            onBlur={() => onStopEdit(false)}
            onKeyDown={e => {
              if (e.key === 'Escape') onStopEdit(true)
              if (e.key === 'Enter') onStopEdit(false)
            }}
          />
        )}
      </div>
    )
  }

  // ── RENDER VIEW ───────────────────────────────────────────────────────────

  // Custom cell renderer
  if (colDef.cellRenderer) {
    return (
      <div
        className={cellClass}
        style={cellStyle}
        role="gridcell"
        tabIndex={isFocused ? 0 : -1}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        onContextMenu={e => { e.preventDefault(); onContextMenu?.(e) }}
        title={colDef.tooltipField === true ? formattedValue : undefined}
      >
        {colDef.cellRenderer({
          value: rawValue,
          data,
          colDef,
          rowIndex,
          field,
          api: null as unknown as CellRendererParams<T>['api'],
          formattedValue,
        })}
      </div>
    )
  }

  // Default cell render
  return (
    <div
      className={cellClass}
      style={cellStyle}
      role="gridcell"
      tabIndex={isFocused ? 0 : -1}
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onContextMenu={e => { e.preventDefault(); onContextMenu?.(e) }}
      title={colDef.tooltipField === true ? formattedValue : colDef.ellipsis !== false ? formattedValue : undefined}
    >
      <span className="adg-cell__text">{formattedValue}</span>
    </div>
  )
}
