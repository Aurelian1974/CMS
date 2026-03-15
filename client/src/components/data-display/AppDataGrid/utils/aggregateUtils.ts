import type { ColDef, AggFuncCustom } from '../AppDataGrid.types'
import { getNestedValue, getColField } from '../AppDataGrid.types'

/** Calculează agregate pe un set de rânduri, pe baza coloanelor cu aggFunc. */
export function computeAggregates<T extends object>(
  rows: T[],
  columnDefs: ColDef<T>[],
  customAggFuncs?: Record<string, AggFuncCustom>,
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const col of flattenColumns(columnDefs)) {
    const field = getColField(col)
    if (!field || !col.aggFunc) continue

    const values = rows.map(r => getNestedValue(r, field))

    if (typeof col.aggFunc === 'function') {
      result[field] = col.aggFunc({ values })
    } else if (typeof col.aggFunc === 'string' && customAggFuncs?.[col.aggFunc]) {
      result[field] = customAggFuncs[col.aggFunc]({ values })
    } else {
      result[field] = computeBuiltinAgg(col.aggFunc as string, values)
    }
  }

  return result
}

/** Calculează o funcție de agregare built-in. */
function computeBuiltinAgg(func: string, values: unknown[]): unknown {
  const nums = values.filter(v => v !== null && v !== undefined && !isNaN(Number(v))).map(Number)

  switch (func) {
    case 'sum':
      return nums.reduce((acc, n) => acc + n, 0)
    case 'avg':
      return nums.length ? nums.reduce((acc, n) => acc + n, 0) / nums.length : 0
    case 'count':
      return values.filter(v => v !== null && v !== undefined).length
    case 'min':
      return nums.length ? Math.min(...nums) : null
    case 'max':
      return nums.length ? Math.max(...nums) : null
    default:
      return null
  }
}

/** Flatten-uiește coloane cu children (column groups) → array flat. */
export function flattenColumns<T>(columns: ColDef<T>[]): ColDef<T>[] {
  const result: ColDef<T>[] = []
  for (const col of columns) {
    if (col.children?.length) {
      result.push(...flattenColumns(col.children as ColDef<T>[]))
    } else {
      result.push(col)
    }
  }
  return result
}

/** Formatează valoarea agregată pentru afișare. */
export function formatAggValue(aggFunc: string, value: unknown): string {
  if (value === null || value === undefined) return ''

  const num = Number(value)
  if (isNaN(num)) return String(value)

  switch (aggFunc) {
    case 'avg':
      return num.toFixed(2)
    case 'count':
      return String(Math.round(num))
    default:
      return num.toLocaleString()
  }
}
