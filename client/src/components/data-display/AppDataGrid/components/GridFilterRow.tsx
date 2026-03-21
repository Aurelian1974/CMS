import React, { useState, useRef, useEffect, useCallback } from 'react'
import type { FilterModel, FilterCondition, ColDef, FilterOperator, GridLocaleText } from '../AppDataGrid.types'
import { getColField } from '../AppDataGrid.types'
import { DEFAULT_LOCALE_TEXT } from '../utils/localeUtils'

export interface GridFilterRowProps<T extends object> {
  columns: ColDef<T>[]
  columnWidths: Map<string, number>
  filterModel: FilterModel
  onFilterChange: (field: string, condition: FilterCondition) => void
  onFilterClear: (field: string) => void
  hasCheckboxSelection?: boolean
  localeText?: Partial<GridLocaleText>
}

// Operator labels per filter type
export const TEXT_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'contains', label: 'Conține' },
  { value: 'notContains', label: 'Nu conține' },
  { value: 'equals', label: 'Egal cu' },
  { value: 'notEquals', label: 'Diferit de' },
  { value: 'startsWith', label: 'Începe cu' },
  { value: 'endsWith', label: 'Se termină cu' },
  { value: 'blank', label: 'Gol' },
  { value: 'notBlank', label: 'Nu e gol' },
]

export const NUMBER_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: '=' },
  { value: 'notEquals', label: '≠' },
  { value: 'greaterThan', label: '>' },
  { value: 'greaterThanOrEqual', label: '≥' },
  { value: 'lessThan', label: '<' },
  { value: 'lessThanOrEqual', label: '≤' },
  { value: 'between', label: 'Între' },
  { value: 'blank', label: 'Gol' },
  { value: 'notBlank', label: 'Nu e gol' },
]

export const DATE_OPERATORS: { value: FilterOperator; label: string }[] = [
  { value: 'equals', label: 'Egal cu' },
  { value: 'notEquals', label: 'Diferit de' },
  { value: 'greaterThan', label: 'După' },
  { value: 'lessThan', label: 'Înainte de' },
  { value: 'between', label: 'Între' },
  { value: 'blank', label: 'Gol' },
  { value: 'notBlank', label: 'Nu e gol' },
]

export function getOperators(filterType: string) {
  switch (filterType) {
    case 'number': return NUMBER_OPERATORS
    case 'date': return DATE_OPERATORS
    default: return TEXT_OPERATORS
  }
}

export const NO_VALUE_OPERATORS: FilterOperator[] = ['blank', 'notBlank']

export interface FilterPopupProps {
  field: string
  filterType: string
  currentFilter?: FilterCondition
  operators: { value: FilterOperator; label: string }[]
  onApply: (field: string, condition: FilterCondition) => void
  onClear: (field: string) => void
  onClose: () => void
  anchorRect: DOMRect
}

export function FilterPopup({ field, filterType, currentFilter, operators, onApply, onClear, onClose, anchorRect }: FilterPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [operator, setOperator] = useState<FilterOperator>(currentFilter?.operator ?? operators[0].value)
  const [value, setValue] = useState<string>(currentFilter?.value != null ? String(currentFilter.value) : '')
  const [valueTo, setValueTo] = useState<string>(currentFilter?.valueTo != null ? String(currentFilter.valueTo) : '')

  const needsValue = !NO_VALUE_OPERATORS.includes(operator)
  const isBetween = operator === 'between'

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  const handleApply = () => {
    if (needsValue && !value) return
    const parsedValue = filterType === 'number' ? Number(value) : value
    const parsedValueTo = filterType === 'number' ? Number(valueTo) : valueTo
    onApply(field, {
      field,
      operator,
      value: needsValue ? parsedValue : true,
      ...(isBetween ? { valueTo: parsedValueTo } : {}),
    })
    onClose()
  }

  const handleClear = () => {
    onClear(field)
    onClose()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleApply()
    if (e.key === 'Escape') onClose()
  }

  const inputType = filterType === 'number' ? 'number' : filterType === 'date' ? 'date' : 'text'

  return (
    <div
      ref={popupRef}
      className="adg-filter-popup"
      style={{
        position: 'fixed',
        top: anchorRect.bottom + 2,
        left: anchorRect.left,
        zIndex: 9999,
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="adg-filter-popup__operator">
        <select
          className="adg-filter-popup__select"
          value={operator}
          onChange={e => setOperator(e.target.value as FilterOperator)}
        >
          {operators.map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>
      </div>

      {needsValue && (
        <div className="adg-filter-popup__value">
          <input
            className="adg-filter-popup__input"
            type={inputType}
            value={value}
            onChange={e => setValue(e.target.value)}
            placeholder="Valoare..."
            autoFocus
          />
        </div>
      )}

      {isBetween && (
        <div className="adg-filter-popup__value">
          <input
            className="adg-filter-popup__input"
            type={inputType}
            value={valueTo}
            onChange={e => setValueTo(e.target.value)}
            placeholder="Până la..."
          />
        </div>
      )}

      <div className="adg-filter-popup__actions">
        <button className="adg-filter-popup__btn adg-filter-popup__btn--clear" onClick={handleClear}>
          Șterge
        </button>
        <button className="adg-filter-popup__btn adg-filter-popup__btn--apply" onClick={handleApply}>
          Aplică
        </button>
      </div>
    </div>
  )
}


export function GridFilterRow<T extends object>(props: GridFilterRowProps<T>) {
  const { columns, columnWidths, filterModel, onFilterChange, onFilterClear, hasCheckboxSelection, localeText } = props
  const [openPopup, setOpenPopup] = useState<string | null>(null)
  const [popupRect, setPopupRect] = useState<DOMRect | null>(null)

  const locale = { ...DEFAULT_LOCALE_TEXT, ...localeText }

  const handleOpenPopup = useCallback((field: string, el: HTMLElement) => {
    setPopupRect(el.getBoundingClientRect())
    setOpenPopup(field)
  }, [])

  const handleClosePopup = useCallback(() => {
    setOpenPopup(null)
    setPopupRect(null)
  }, [])

  return (
    <div className="adg-filter-row" role="row">
      {hasCheckboxSelection && (
        <div className="adg-filter-row__cell adg-filter-row__cell--empty" role="gridcell" />
      )}

      {columns.map(col => {
        const field = getColField(col)
        const width = columnWidths.get(field) ?? col.width ?? 150
        const filterable = col.filterable !== false
        const filterType = col.filterType ?? 'text'

        if (!filterable) {
          return <div key={field} className="adg-filter-row__cell adg-filter-row__cell--empty" style={{ width }} role="gridcell" />
        }

        // Custom filter renderer
        if (col.filterRenderer) {
          return (
            <div key={field} className="adg-filter-row__cell" style={{ width }} role="gridcell">
              {col.filterRenderer({
                colDef: col as ColDef,
                field,
                filterValue: filterModel[field],
                setFilter: v => onFilterChange(field, v as FilterCondition),
                clearFilter: () => onFilterClear(field),
              })}
            </div>
          )
        }

        const currentFilter = filterModel[field] as FilterCondition | undefined
        const hasFilter = !!currentFilter
        const operators = getOperators(filterType)

        // Boolean & Set — keep simple inline
        if (filterType === 'boolean') {
          const currentValue = currentFilter?.value ?? ''
          return (
            <div key={field} className="adg-filter-row__cell" style={{ width }} role="gridcell">
              <select
                className="adg-filter-row__input adg-filter-row__input--select"
                value={String(currentValue)}
                onChange={e => {
                  const v = e.target.value
                  if (!v) onFilterClear(field)
                  else onFilterChange(field, { field, operator: 'equals', value: v === 'true' })
                }}
              >
                <option value="">—</option>
                <option value="true">Da</option>
                <option value="false">Nu</option>
              </select>
            </div>
          )
        }

        if (filterType === 'set' && col.filterOptions) {
          const currentValue = currentFilter?.value ?? ''
          return (
            <div key={field} className="adg-filter-row__cell" style={{ width }} role="gridcell">
              <select
                className="adg-filter-row__input adg-filter-row__input--select"
                value={String(currentValue)}
                onChange={e => {
                  const v = e.target.value
                  if (!v) onFilterClear(field)
                  else onFilterChange(field, { field, operator: 'equals', value: v })
                }}
              >
                <option value="">—</option>
                {col.filterOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )
        }

        // Text / Number / Date — advanced filter with popup
        const displayLabel = currentFilter
          ? `${operators.find(o => o.value === currentFilter.operator)?.label ?? currentFilter.operator}: ${NO_VALUE_OPERATORS.includes(currentFilter.operator) ? '' : currentFilter.value}${currentFilter.valueTo != null ? ` - ${currentFilter.valueTo}` : ''}`
          : ''

        return (
          <div key={field} className="adg-filter-row__cell" style={{ width }} role="gridcell">
            <div
              className={`adg-filter-row__trigger ${hasFilter ? 'adg-filter-row__trigger--active' : ''}`}
              onClick={e => handleOpenPopup(field, e.currentTarget)}
              title={displayLabel || locale.filterPlaceholder}
            >
              <span className="adg-filter-row__trigger-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
              </span>
              <span className="adg-filter-row__trigger-text">
                {displayLabel || locale.filterPlaceholder || 'Filtrare...'}
              </span>
              {hasFilter && (
                <button
                  className="adg-filter-row__trigger-clear"
                  onClick={e => { e.stopPropagation(); onFilterClear(field) }}
                  title="Șterge filtrul"
                >
                  ×
                </button>
              )}
            </div>
            {openPopup === field && popupRect && (
              <FilterPopup
                field={field}
                filterType={filterType}
                currentFilter={currentFilter}
                operators={operators}
                onApply={onFilterChange}
                onClear={onFilterClear}
                onClose={handleClosePopup}
                anchorRect={popupRect}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
