import type { ColDef, GroupRow, AggFuncCustom } from '../AppDataGrid.types'
import { getNestedValue, getColField } from '../AppDataGrid.types'
import { computeAggregates } from './aggregateUtils'

/** Construiește ierarhia de grupuri dintr-un array flat. */
export function buildGroupTree<T extends object>(
  rows: T[],
  groupFields: string[],
  columnDefs: ColDef<T>[],
  customAggFuncs?: Record<string, AggFuncCustom>,
  level = 0,
  parentKey = '',
): Array<T | GroupRow<T>> {
  if (level >= groupFields.length) return rows

  const field = groupFields[level]
  const groups = new Map<unknown, T[]>()

  // Grupează rândurile după valoarea câmpului curent
  for (const row of rows) {
    const value = getNestedValue(row, field)
    const key = value ?? '__null__'
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(row)
  }

  const result: Array<T | GroupRow<T>> = []

  for (const [value, children] of groups) {
    const groupKey = parentKey ? `${parentKey}|${field}:${String(value)}` : `${field}:${String(value)}`
    const groupValue = value === '__null__' ? null : value

    // Calculează agregate pentru acest grup
    const aggregates = computeAggregates(children, columnDefs, customAggFuncs)

    // Recursiv: sub-grupuri
    const nestedChildren = buildGroupTree(children, groupFields, columnDefs, customAggFuncs, level + 1, groupKey)

    const groupRow: GroupRow<T> = {
      __isGroup: true,
      __groupField: field,
      __groupValue: groupValue,
      __groupKey: groupKey,
      __groupLevel: level,
      __childCount: children.length,
      __expanded: false, // se setează din expandedGroups
      __children: nestedChildren,
      __aggregates: aggregates,
    }

    result.push(groupRow)
  }

  return result
}

/** Flatten-uiește arborele de grupuri ținând cont de starea expanded. */
export function flattenGroupTree<T>(
  tree: Array<T | GroupRow<T>>,
  expandedGroups: Set<string>,
): Array<T | GroupRow<T>> {
  const result: Array<T | GroupRow<T>> = []

  for (const item of tree) {
    if (isGroupRowCheck(item)) {
      const group = item as GroupRow<T>
      group.__expanded = expandedGroups.has(group.__groupKey)
      result.push(group)

      if (group.__expanded) {
        const children = flattenGroupTree(group.__children, expandedGroups)
        result.push(...children)
      }
    } else {
      result.push(item)
    }
  }

  return result
}

/** Colectează toate group keys dintr-un arbore. */
export function collectAllGroupKeys<T>(tree: Array<T | GroupRow<T>>): string[] {
  const keys: string[] = []
  for (const item of tree) {
    if (isGroupRowCheck(item)) {
      const group = item as GroupRow<T>
      keys.push(group.__groupKey)
      keys.push(...collectAllGroupKeys(group.__children))
    }
  }
  return keys
}

/** Obține toate rândurile leaf dintr-un grup (non-grup). */
export function getLeafRows<T>(group: GroupRow<T>): T[] {
  const leaves: T[] = []
  for (const child of group.__children) {
    if (isGroupRowCheck(child)) {
      leaves.push(...getLeafRows(child as GroupRow<T>))
    } else {
      leaves.push(child as T)
    }
  }
  return leaves
}

/** Obține headerName-ul unui group field. */
export function getGroupFieldHeader<T>(field: string, columnDefs: ColDef<T>[]): string {
  for (const col of columnDefs) {
    const colField = getColField(col)
    if (colField === field) return col.headerName ?? field
    if (col.children) {
      const found = getGroupFieldHeader(field, col.children as ColDef<T>[])
      if (found !== field) return found
    }
  }
  return field
}

function isGroupRowCheck(item: unknown): boolean {
  return item !== null && typeof item === 'object' && '__isGroup' in (item as Record<string, unknown>)
}
