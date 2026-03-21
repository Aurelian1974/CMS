import React from 'react'
import type { StatusBarPanel, StatusBarRenderParams, GridLocaleText } from '../AppDataGrid.types'
import { DEFAULT_LOCALE_TEXT } from '../utils/localeUtils'

export interface GridStatusBarProps<T extends object> {
  panels: StatusBarPanel[]
  totalCount: number
  filteredCount: number
  selectedRows: T[]
  displayedRows: T[]
  footerAggregates: Record<string, Record<string, unknown>>
  localeText?: Partial<GridLocaleText>
  apiRef: React.RefObject<unknown>
}

export function GridStatusBar<T extends object>(props: GridStatusBarProps<T>) {
  const {
    panels, totalCount, filteredCount, selectedRows,
    displayedRows: _displayedRows, footerAggregates, localeText, apiRef,
  } = props

  const locale = { ...DEFAULT_LOCALE_TEXT, ...localeText }

  const renderPanel = (panel: StatusBarPanel) => {
    if (panel.render) {
      return (
        <div key={panel.id} className={`adg-status-bar__panel adg-status-bar__panel--${panel.align ?? 'left'}`}>
          {panel.render({
            api: apiRef.current,
            selectedRows,
            totalCount,
            filteredCount,
          } as StatusBarRenderParams<unknown>)}
        </div>
      )
    }

    let content: React.ReactNode = null

    switch (panel.type) {
      case 'total-count':
        content = <span>{locale.totalRecords}: {totalCount}</span>
        break
      case 'filtered-count':
        content = filteredCount < totalCount
          ? <span>{locale.filteredRecords}: {filteredCount}</span>
          : null
        break
      case 'selected-count':
        content = selectedRows.length > 0
          ? <span>{locale.selectedCount}: {selectedRows.length}</span>
          : null
        break
      case 'sum':
      case 'avg':
      case 'min':
      case 'max':
        if (panel.field && footerAggregates[panel.field]) {
          const val = footerAggregates[panel.field][panel.type]
          content = <span>{panel.label ?? `${panel.type}(${panel.field})`}: {String(val ?? '—')}</span>
        }
        break
    }

    if (!content) return null

    return (
      <div key={panel.id} className={`adg-status-bar__panel adg-status-bar__panel--${panel.align ?? 'left'}`}>
        {content}
      </div>
    )
  }

  const leftPanels = panels.filter(p => p.align !== 'center' && p.align !== 'right')
  const centerPanels = panels.filter(p => p.align === 'center')
  const rightPanels = panels.filter(p => p.align === 'right')

  return (
    <div className="adg-status-bar" role="status">
      <div className="adg-status-bar__left">{leftPanels.map(renderPanel)}</div>
      <div className="adg-status-bar__center">{centerPanels.map(renderPanel)}</div>
      <div className="adg-status-bar__right">{rightPanels.map(renderPanel)}</div>
    </div>
  )
}
