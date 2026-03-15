import React from 'react'
import type { ColDef, AggFunc } from '../AppDataGrid.types'
import { getColField } from '../AppDataGrid.types'

export interface GridFooterRowProps<T extends object> {
  columns: ColDef<T>[]
  columnWidths: Map<string, number>
  aggregates: Record<string, Record<string, unknown>>
  hasCheckboxSelection?: boolean
}

export function GridFooterRow<T extends object>(props: GridFooterRowProps<T>) {
  const { columns, columnWidths, aggregates, hasCheckboxSelection } = props

  const hasAnyAggregate = columns.some(c => c.aggFunc)
  if (!hasAnyAggregate) return null

  return (
    <div className="adg-footer-row" role="row">
      {hasCheckboxSelection && (
        <div className="adg-footer-row__cell adg-footer-row__cell--checkbox" role="gridcell" />
      )}

      {columns.map(col => {
        const field = getColField(col)
        const width = columnWidths.get(field) ?? col.width ?? 150
        const agg = aggregates[field]
        const aggFunc = col.aggFunc

        let displayValue = ''
        if (agg && aggFunc) {
          const funcName = typeof aggFunc === 'string' ? aggFunc : 'custom'
          const val = agg[funcName]
          if (val !== undefined && val !== null) {
            displayValue = typeof val === 'number' ? val.toLocaleString('ro-RO') : String(val)
          }
        }

        return (
          <div
            key={field}
            className={`adg-footer-row__cell ${aggFunc ? 'adg-footer-row__cell--aggregate' : ''}`}
            style={{ width }}
            role="gridcell"
          >
            {displayValue && (
              <span className="adg-footer-row__value">
                {typeof aggFunc === 'string' && (
                  <span className="adg-footer-row__func">{aggFunc}: </span>
                )}
                {displayValue}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
