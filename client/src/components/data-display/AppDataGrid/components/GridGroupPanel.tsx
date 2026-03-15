import React, { useState } from 'react'
import type { GridLocaleText } from '../AppDataGrid.types'
import { DEFAULT_LOCALE_TEXT } from '../utils/localeUtils'

export interface GridGroupPanelProps {
  groupFields: string[]
  columnHeaders: Map<string, string>
  onRemoveGroup: (field: string) => void
  onClearGroups: () => void
  onDrop?: (field: string) => void
  localeText?: Partial<GridLocaleText>
}

export function GridGroupPanel(props: GridGroupPanelProps) {
  const { groupFields, columnHeaders, onRemoveGroup, onClearGroups, onDrop, localeText } = props
  const [dragOver, setDragOver] = useState(false)

  const locale = { ...DEFAULT_LOCALE_TEXT, ...localeText }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(false)
    const field = e.dataTransfer.getData('text/column-field') || e.dataTransfer.getData('text/plain')
    if (field && !groupFields.includes(field)) {
      onDrop?.(field)
    }
  }

  return (
    <div
      className={`adg-group-panel ${dragOver ? 'adg-group-panel--drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {groupFields.length === 0 ? (
        <span className="adg-group-panel__placeholder">
          {locale.groupPanelPlaceholder ?? 'Trageți o coloană aici pentru grupare'}
        </span>
      ) : (
        <>
          {groupFields.map(field => (
            <div key={field} className="adg-group-panel__chip">
              <span className="adg-group-panel__chip-text">
                {columnHeaders.get(field) ?? field}
              </span>
              <button
                className="adg-group-panel__chip-remove"
                onClick={() => onRemoveGroup(field)}
                title="Elimină gruparea"
              >
                ×
              </button>
            </div>
          ))}
          <button
            className="adg-group-panel__clear"
            onClick={onClearGroups}
            title="Șterge toate grupările"
          >
            Șterge tot
          </button>
        </>
      )}
    </div>
  )
}
