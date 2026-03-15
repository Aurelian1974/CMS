import React, { useState, useMemo } from 'react'
import type { ColDef, GridLocaleText } from '../AppDataGrid.types'
import { getColField, isGroupRow } from '../AppDataGrid.types'
import { DEFAULT_LOCALE_TEXT } from '../utils/localeUtils'

export interface GridColumnChooserProps<T extends object> {
  columns: ColDef<T>[]
  hiddenColumns: Set<string>
  onToggleColumn: (field: string, visible: boolean) => void
  onClose: () => void
  localeText?: Partial<GridLocaleText>
}

export function GridColumnChooser<T extends object>(props: GridColumnChooserProps<T>) {
  const { columns, hiddenColumns, onToggleColumn, onClose, localeText } = props

  const locale = { ...DEFAULT_LOCALE_TEXT, ...localeText }
  const [search, setSearch] = useState('')

  const filteredColumns = useMemo(() => {
    return columns.filter(col => {
      const field = getColField(col)
      const name = col.headerName ?? field
      if (col.lockPosition) return false // Don't show locked columns
      if (search && !name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [columns, search])

  const allVisible = filteredColumns.every(c => !hiddenColumns.has(getColField(c)))

  return (
    <div className="adg-column-chooser" role="dialog" aria-label={locale.columnChooserTitle}>
      <div className="adg-column-chooser__header">
        <h3 className="adg-column-chooser__title">{locale.columnChooserTitle ?? 'Coloane'}</h3>
        <button className="adg-column-chooser__close" onClick={onClose} aria-label="Închide">×</button>
      </div>

      <div className="adg-column-chooser__search">
        <input
          type="text"
          className="adg-column-chooser__search-input"
          placeholder={locale.columnChooserSearch ?? 'Caută coloană...'}
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="adg-column-chooser__select-all">
        <label>
          <input
            type="checkbox"
            checked={allVisible}
            onChange={() => {
              for (const col of filteredColumns) {
                onToggleColumn(getColField(col), !allVisible)
              }
            }}
          />
          {locale.columnChooserSelectAll ?? 'Selectează toate'}
        </label>
      </div>

      <div className="adg-column-chooser__list">
        {filteredColumns.map(col => {
          const field = getColField(col)
          const name = col.headerName ?? field
          const visible = !hiddenColumns.has(field)

          return (
            <label key={field} className="adg-column-chooser__item">
              <input
                type="checkbox"
                checked={visible}
                onChange={() => onToggleColumn(field, !visible)}
              />
              <span>{name}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
