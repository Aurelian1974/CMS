import React from 'react'
import type { ColDef, GroupRow } from '../AppDataGrid.types'

export interface GridGroupRowProps<T extends object> {
  groupRow: GroupRow<T>
  columns: ColDef<T>[]
  columnWidths: Map<string, number>
  onToggle: () => void
  customRenderer?: (params: unknown) => React.ReactNode
  apiRef?: React.RefObject<unknown>
  hasCheckboxSelection?: boolean
  groupRowRenderer?: (params: {
    groupField: string
    groupValue: unknown
    groupKey: string
    level: number
    childCount: number
    expanded: boolean
    toggleExpand: () => void
    aggregates: Record<string, unknown>
  }) => React.ReactNode
}

export function GridGroupRow<T extends object>(props: GridGroupRowProps<T>) {
  const { groupRow, onToggle, groupRowRenderer } = props

  const indent = groupRow.__groupLevel * 24

  // Custom renderer
  if (groupRowRenderer) {
    return (
      <div className="adg-group-row" role="row" aria-expanded={groupRow.__expanded}>
        <div className="adg-group-row__content" style={{ paddingLeft: indent }}>
          {groupRowRenderer({
            groupField: groupRow.__groupField,
            groupValue: groupRow.__groupValue,
            groupKey: groupRow.__groupKey,
            level: groupRow.__groupLevel,
            childCount: groupRow.__childCount,
            expanded: groupRow.__expanded,
            toggleExpand: onToggle,
            aggregates: groupRow.__aggregates,
          })}
        </div>
      </div>
    )
  }

  return (
    <div
      className={`adg-group-row ${groupRow.__expanded ? 'adg-group-row--expanded' : ''}`}
      role="row"
      aria-expanded={groupRow.__expanded}
      onClick={onToggle}
    >
      <div className="adg-group-row__content" style={{ paddingLeft: indent }}>
        <span className="adg-group-row__toggle">
          {groupRow.__expanded ? '▼' : '▶'}
        </span>
        <span className="adg-group-row__label">
          {groupRow.__groupField}: <strong>{String(groupRow.__groupValue ?? '(Gol)')}</strong>
        </span>
        <span className="adg-group-row__count">
          ({groupRow.__childCount})
        </span>

        {/* Inline aggregates */}
        {Object.keys(groupRow.__aggregates).length > 0 && (
          <span className="adg-group-row__aggregates">
            {Object.entries(groupRow.__aggregates).map(([field, val]) => (
              <span key={field} className="adg-group-row__agg-item">
                {field}: {String(val)}
              </span>
            ))}
          </span>
        )}
      </div>
    </div>
  )
}
