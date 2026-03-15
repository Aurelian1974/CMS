import React, { useState, useCallback, useMemo } from 'react'
import type { ToolbarItem, GridLocaleText, ExcelExportParams, ExportParams, PdfExportParams } from '../AppDataGrid.types'
import { DEFAULT_LOCALE_TEXT } from '../utils/localeUtils'

export interface GridToolbarProps {
  items: ToolbarItem[]
  quickFilterText: string
  onQuickFilterChange: (text: string) => void
  onExportExcel?: (params?: ExcelExportParams) => void
  onExportCsv?: (params?: ExportParams) => void
  onExportPdf?: (params?: PdfExportParams) => void
  onPrint?: () => void
  onToggleColumnChooser?: () => void
  localeText?: Partial<GridLocaleText>
}

export function GridToolbar(props: GridToolbarProps) {
  const {
    items, quickFilterText, onQuickFilterChange,
    onExportExcel, onExportCsv, onExportPdf, onPrint,
    onToggleColumnChooser, localeText,
  } = props

  const locale = { ...DEFAULT_LOCALE_TEXT, ...localeText }

  const leftItems = items.filter(i => i.align !== 'right')
  const rightItems = items.filter(i => i.align === 'right')

  const renderItem = (item: ToolbarItem) => {
    if (item.type === 'separator') {
      return <div key={item.id} className="adg-toolbar__separator" />
    }

    if (item.type === 'custom' && item.render) {
      return <div key={item.id} className="adg-toolbar__custom">{item.render()}</div>
    }

    if (item.type === 'search') {
      return (
        <div key={item.id} className="adg-toolbar__search">
          <input
            type="text"
            className="adg-toolbar__search-input"
            placeholder={locale.searchPlaceholder ?? 'Căutare...'}
            value={quickFilterText}
            onChange={e => onQuickFilterChange(e.target.value)}
          />
          {quickFilterText && (
            <button
              className="adg-toolbar__search-clear"
              onClick={() => onQuickFilterChange('')}
              title="Șterge căutarea"
            >
              ×
            </button>
          )}
        </div>
      )
    }

    const actionMap: Record<string, (() => void) | undefined> = {
      'export-excel': () => onExportExcel?.(),
      'export-csv': () => onExportCsv?.(),
      'export-pdf': () => onExportPdf?.(),
      'print': () => onPrint?.(),
      'column-chooser': () => onToggleColumnChooser?.(),
    }

    const labelMap: Record<string, string> = {
      'export-excel': locale.exportExcel ?? 'Excel',
      'export-csv': locale.exportCsv ?? 'CSV',
      'export-pdf': locale.exportPdf ?? 'PDF',
      'print': locale.print ?? 'Printare',
      'column-chooser': locale.columnChooser ?? 'Coloane',
    }

    return (
      <button
        key={item.id}
        className="adg-toolbar__btn"
        disabled={item.disabled}
        onClick={item.onClick ?? actionMap[item.type]}
        title={item.text ?? labelMap[item.type]}
      >
        {item.icon && <span className="adg-toolbar__btn-icon">{item.icon}</span>}
        <span className="adg-toolbar__btn-text">{item.text ?? labelMap[item.type]}</span>
      </button>
    )
  }

  return (
    <div className="adg-toolbar" role="toolbar">
      <div className="adg-toolbar__left">
        {leftItems.map(renderItem)}
      </div>
      <div className="adg-toolbar__right">
        {rightItems.map(renderItem)}
      </div>
    </div>
  )
}

/** Generează toolbar items implicite bazate pe props booleene. */
export function getDefaultToolbarItems(showSearch: boolean): ToolbarItem[] {
  const items: ToolbarItem[] = []

  if (showSearch) {
    items.push({ id: 'search', type: 'search', align: 'left' })
  }

  items.push({ id: 'export-excel', type: 'export-excel', align: 'right' })
  items.push({ id: 'export-csv', type: 'export-csv', align: 'right' })
  items.push({ id: 'export-pdf', type: 'export-pdf', align: 'right' })
  items.push({ id: 'print', type: 'print', align: 'right' })
  items.push({ id: 'sep-1', type: 'separator', align: 'right' })
  items.push({ id: 'column-chooser', type: 'column-chooser', align: 'right' })

  return items
}
