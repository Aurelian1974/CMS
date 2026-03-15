import { getNestedValue } from '../AppDataGrid.types'
import type { ColDef, SortModelItem } from '../AppDataGrid.types'

/** Comparator generic care detectează tipul valorii. */
export function defaultComparator(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1
  if (b === null || b === undefined) return -1

  // Date
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()

  // Numere
  const numA = Number(a)
  const numB = Number(b)
  if (!isNaN(numA) && !isNaN(numB)) return numA - numB

  // Boolean
  if (typeof a === 'boolean' && typeof b === 'boolean') return a === b ? 0 : a ? -1 : 1

  // String
  return String(a).localeCompare(String(b))
}

/** Comparator cu suport diacritice (accented sort). */
export function accentedComparator(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : 1
  if (b === null || b === undefined) return -1

  const numA = Number(a)
  const numB = Number(b)
  if (!isNaN(numA) && !isNaN(numB)) return numA - numB

  return String(a).localeCompare(String(b), undefined, { sensitivity: 'accent' })
}

/** Sortează un array de rânduri după mai multe coloane. */
export function multiColumnSort<T>(
  rows: T[],
  sortModel: SortModelItem[],
  columnDefs: ColDef<T>[],
  accentedSort = true,
): T[] {
  if (!sortModel.length) return rows

  const colMap = new Map(columnDefs.map(c => [c.field ?? c.colId ?? '', c]))

  const sorted = [...rows]
  sorted.sort((rowA, rowB) => {
    for (const sm of sortModel) {
      if (!sm.direction) continue

      const col = colMap.get(sm.field)
      const valA = getNestedValue(rowA, sm.field)
      const valB = getNestedValue(rowB, sm.field)

      let result: number
      if (col?.comparator) {
        result = col.comparator(valA, valB, rowA, rowB, sm.direction === 'desc')
      } else {
        result = accentedSort ? accentedComparator(valA, valB) : defaultComparator(valA, valB)
      }

      if (result !== 0) {
        return sm.direction === 'desc' ? -result : result
      }
    }
    return 0
  })

  return sorted
}

/** Avansează sortarea tri-state: null → asc → desc → null. */
export function nextSortDirection(current: SortModelItem['direction']): SortModelItem['direction'] {
  if (!current) return 'asc'
  if (current === 'asc') return 'desc'
  return null
}

/** Actualizează sort model la click pe coloană. */
export function updateSortModel(
  current: SortModelItem[],
  field: string,
  multiSort: boolean,
  triState: boolean,
): SortModelItem[] {
  const existing = current.find(s => s.field === field)
  const newDir = triState
    ? nextSortDirection(existing?.direction ?? null)
    : existing?.direction === 'asc' ? 'desc' : 'asc'

  if (multiSort) {
    if (!newDir) {
      // Elimină din model
      return current.filter(s => s.field !== field)
    }
    if (existing) {
      return current.map(s => s.field === field ? { ...s, direction: newDir } : s)
    }
    return [...current, { field, direction: newDir }]
  }

  // Single sort
  if (!newDir) return []
  return [{ field, direction: newDir }]
}
