import type { ColDef, ColumnPinned } from '../AppDataGrid.types'
import { getColField } from '../AppDataGrid.types'
import { flattenColumns } from './aggregateUtils'

/** Aplică defaultColDef pe toate coloanele (deep merge). */
export function applyDefaultColDef<T>(
  columnDefs: ColDef<T>[],
  defaults?: Partial<ColDef<T>>,
): ColDef<T>[] {
  if (!defaults) return columnDefs

  return columnDefs.map(col => {
    const merged = { ...defaults, ...col } as ColDef<T>
    // Nu override explicit false/null
    for (const key of Object.keys(col) as (keyof ColDef<T>)[]) {
      (merged as Record<string, unknown>)[key as string] = col[key]
    }
    if (col.children) {
      merged.children = applyDefaultColDef(col.children as ColDef<T>[], defaults) as ColDef[]
    }
    return merged
  })
}

/** Aplică column types pe coloane. */
export function applyColumnTypes<T>(
  columnDefs: ColDef<T>[],
  types?: Record<string, Partial<ColDef<T>>>,
): ColDef<T>[] {
  if (!types) return columnDefs

  return columnDefs.map(col => {
    if (!col.type) return col

    const typeNames = Array.isArray(col.type) ? col.type : [col.type]
    let merged: ColDef<T> = { ...col }
    for (const typeName of typeNames) {
      const typeDef = types[typeName]
      if (typeDef) {
        merged = { ...typeDef, ...merged } as ColDef<T>
      }
    }
    return merged
  })
}

/** Calculează lățimea automată pe baza conținutului (estimare canvas). */
export function autoSizeColumnWidth<T>(
  field: string,
  rows: T[],
  headerName: string,
  fontSize = 14,
  padding = 24,
  maxWidth = 500,
): number {
  // Folosim un canvas offscreen pentru a măsura textul
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return 150

  ctx.font = `${fontSize}px Inter, sans-serif`

  let max = ctx.measureText(headerName).width + padding + 30 // 30 for sort icon space

  const sampleSize = Math.min(rows.length, 100)
  for (let i = 0; i < sampleSize; i++) {
    const row = rows[i]
    const value = getNestedValueSafe(row, field)
    const text = value !== null && value !== undefined ? String(value) : ''
    const width = ctx.measureText(text).width + padding
    if (width > max) max = width
  }

  return Math.min(Math.max(max, 60), maxWidth)
}

/** Distribuie flex pe coloane, dând fiecărei coloane flex proporțional din spațiul disponibil. */
export function distributeFlexWidths<T>(
  columns: ColDef<T>[],
  columnWidths: Map<string, number>,
  containerWidth: number,
): Map<string, number> {
  const flat = flattenColumns(columns)
  const result = new Map(columnWidths)

  // Calculează spațiul ocupat de coloanele non-flex
  let usedWidth = 0
  let totalFlex = 0

  for (const col of flat) {
    const field = getColField(col)
    if (!field) continue
    if (col.flex && col.flex > 0) {
      totalFlex += col.flex
    } else {
      usedWidth += result.get(field) ?? col.width ?? col.minWidth ?? 150
    }
  }

  if (totalFlex <= 0) return result

  const availableWidth = Math.max(0, containerWidth - usedWidth)
  const flexUnit = availableWidth / totalFlex

  for (const col of flat) {
    const field = getColField(col)
    if (!field || !col.flex || col.flex <= 0) continue

    let width = Math.floor(flexUnit * col.flex)
    if (col.minWidth) width = Math.max(width, col.minWidth)
    if (col.maxWidth) width = Math.min(width, col.maxWidth)
    result.set(field, width)
  }

  return result
}

/** Obține coloanele vizibile, sortate pe ordine, cu pinned-urile separate. */
export function getVisibleColumns<T>(
  columns: ColDef<T>[],
  columnOrder: string[],
  hiddenColumns: Set<string>,
  pinnedColumns: Map<string, ColumnPinned>,
): { left: ColDef<T>[]; center: ColDef<T>[]; right: ColDef<T>[] } {
  const flat = flattenColumns(columns)
  const colMap = new Map(flat.map(c => [getColField(c), c]))

  const ordered = columnOrder
    .map(field => colMap.get(field))
    .filter((c): c is ColDef<T> => c !== undefined && !hiddenColumns.has(getColField(c)))

  // Adaugă coloane care nu sunt în order (noi adăugate)
  for (const col of flat) {
    const f = getColField(col)
    if (f && !columnOrder.includes(f) && !hiddenColumns.has(f)) {
      ordered.push(col)
    }
  }

  const left: ColDef<T>[] = []
  const center: ColDef<T>[] = []
  const right: ColDef<T>[] = []

  for (const col of ordered) {
    const f = getColField(col)
    const pinned = pinnedColumns.get(f) ?? col.pinned
    if (pinned === 'left') left.push(col)
    else if (pinned === 'right') right.push(col)
    else center.push(col)
  }

  return { left, center, right }
}

/** Rezolvă column spanning pe un rând. Returnează map field → colSpan. */
export function resolveColumnSpanning<T>(
  columns: ColDef<T>[],
  row: T,
  rowIndex: number,
  api: unknown,
): Map<string, number> {
  const spans = new Map<string, number>()
  for (const col of columns) {
    const field = getColField(col)
    if (!field) continue
    if (col.colSpan) {
      const span = col.colSpan({
        value: getNestedValueSafe(row, field),
        data: row,
        colDef: col,
        rowIndex,
        field,
        api: api as never,
      })
      if (span > 1) spans.set(field, span)
    }
  }
  return spans
}

function getNestedValueSafe(obj: unknown, path: string): unknown {
  try {
    if (!path) return undefined
    const parts = path.split('.')
    let current: unknown = obj
    for (const part of parts) {
      if (current === null || current === undefined) return undefined
      current = (current as Record<string, unknown>)[part]
    }
    return current
  } catch {
    return undefined
  }
}
