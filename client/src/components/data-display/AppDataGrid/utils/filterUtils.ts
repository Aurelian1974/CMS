import type { FilterCondition, FilterGroup, FilterOperator } from '../AppDataGrid.types'
import { getNestedValue } from '../AppDataGrid.types'

/** Aplică un operator de filtrare pe o valoare. */
export function applyFilterOperator(
  cellValue: unknown,
  operator: FilterOperator,
  filterValue: unknown,
  filterValueTo?: unknown,
): boolean {
  // Blank / notBlank — nu depind de filterValue
  if (operator === 'blank') return cellValue === null || cellValue === undefined || cellValue === ''
  if (operator === 'notBlank') return cellValue !== null && cellValue !== undefined && cellValue !== ''

  const cellStr = normalizeString(cellValue)
  const filterStr = normalizeString(filterValue)

  switch (operator) {
    case 'equals':
      return cellStr === filterStr
    case 'notEquals':
      return cellStr !== filterStr
    case 'contains':
      return cellStr.includes(filterStr)
    case 'notContains':
      return !cellStr.includes(filterStr)
    case 'startsWith':
      return cellStr.startsWith(filterStr)
    case 'endsWith':
      return cellStr.endsWith(filterStr)
    case 'greaterThan':
      return compareValues(cellValue, filterValue) > 0
    case 'greaterThanOrEqual':
      return compareValues(cellValue, filterValue) >= 0
    case 'lessThan':
      return compareValues(cellValue, filterValue) < 0
    case 'lessThanOrEqual':
      return compareValues(cellValue, filterValue) <= 0
    case 'between':
      return compareValues(cellValue, filterValue) >= 0 && compareValues(cellValue, filterValueTo) <= 0
    case 'inList': {
      const list = Array.isArray(filterValue) ? filterValue : [filterValue]
      return list.some(v => normalizeString(v) === cellStr)
    }
    case 'notInList': {
      const list = Array.isArray(filterValue) ? filterValue : [filterValue]
      return !list.some(v => normalizeString(v) === cellStr)
    }
    case 'custom':
      return true // handled externally via customFn
    default:
      return true
  }
}

/** Aplică o condiție de filtru pe un rând. */
export function applyFilterCondition(row: unknown, condition: FilterCondition): boolean {
  if (condition.operator === 'custom' && condition.customFn) {
    const cellValue = getNestedValue(row, condition.field)
    return condition.customFn(cellValue, row)
  }
  const cellValue = getNestedValue(row, condition.field)
  return applyFilterOperator(cellValue, condition.operator, condition.value, condition.valueTo)
}

/** Aplică un grup de filtre (AND/OR) pe un rând. */
export function applyFilterGroup(row: unknown, group: FilterGroup): boolean {
  if (group.logic === 'and') {
    return group.conditions.every(c => applyFilterOrGroup(row, c))
  }
  return group.conditions.some(c => applyFilterOrGroup(row, c))
}

/** Aplică fie o condiție, fie un grup. */
export function applyFilterOrGroup(row: unknown, item: FilterCondition | FilterGroup): boolean {
  if ('logic' in item) return applyFilterGroup(row, item)
  return applyFilterCondition(row, item)
}

/** Aplică quick filter (căutare globală) pe un rând. */
export function applyQuickFilter(
  row: unknown,
  text: string,
  fields: string[],
): boolean {
  if (!text) return true
  const searchLower = text.toLowerCase()
  return fields.some(field => {
    const value = getNestedValue(row, field)
    if (value === null || value === undefined) return false
    return String(value).toLowerCase().includes(searchLower)
  })
}

/** Normalizează o valoare la string lowercase. */
function normalizeString(value: unknown): string {
  if (value === null || value === undefined) return ''
  return String(value).toLowerCase()
}

/** Compară două valori numeric sau ca string. */
function compareValues(a: unknown, b: unknown): number {
  if (a === null || a === undefined) return b === null || b === undefined ? 0 : -1
  if (b === null || b === undefined) return 1

  // Date
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime()
  if (a instanceof Date) return a.getTime() - new Date(b as string).getTime()

  // Numere
  const numA = Number(a)
  const numB = Number(b)
  if (!isNaN(numA) && !isNaN(numB)) return numA - numB

  // String
  return String(a).localeCompare(String(b))
}

/** Operatori disponibili per tip de filtru. */
export const FILTER_OPERATORS_BY_TYPE: Record<string, FilterOperator[]> = {
  text: ['contains', 'notContains', 'equals', 'notEquals', 'startsWith', 'endsWith', 'blank', 'notBlank'],
  number: ['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between', 'blank', 'notBlank'],
  date: ['equals', 'notEquals', 'greaterThan', 'greaterThanOrEqual', 'lessThan', 'lessThanOrEqual', 'between', 'blank', 'notBlank'],
  boolean: ['equals', 'notEquals'],
  set: ['inList', 'notInList', 'blank', 'notBlank'],
}

/** Label-uri default pentru operatori. */
export const FILTER_OPERATOR_LABELS: Record<FilterOperator, string> = {
  equals: 'Egal cu',
  notEquals: 'Diferit de',
  contains: 'Conține',
  notContains: 'Nu conține',
  startsWith: 'Începe cu',
  endsWith: 'Se termină cu',
  greaterThan: 'Mai mare decât',
  greaterThanOrEqual: 'Mai mare sau egal',
  lessThan: 'Mai mic decât',
  lessThanOrEqual: 'Mai mic sau egal',
  between: 'Între',
  inList: 'În listă',
  notInList: 'Nu în listă',
  blank: 'Gol',
  notBlank: 'Nu e gol',
  custom: 'Custom',
}
