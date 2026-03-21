import type { FilterOperator } from '../AppDataGrid.types'

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
