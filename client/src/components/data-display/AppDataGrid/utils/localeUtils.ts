import type { GridLocaleText } from '../AppDataGrid.types'

/** Texte locale implicite (română). */
export const DEFAULT_LOCALE_TEXT: GridLocaleText = {
  // Pager
  page: 'Pagina',
  of: 'din',
  items: 'înregistrări',
  itemsPerPage: 'pe pagină',
  firstPage: 'Prima pagină',
  previousPage: 'Pagina anterioară',
  nextPage: 'Pagina următoare',
  lastPage: 'Ultima pagină',

  // Filter
  filterPlaceholder: 'Filtrează...',
  filterEquals: 'Egal cu',
  filterNotEquals: 'Diferit de',
  filterContains: 'Conține',
  filterNotContains: 'Nu conține',
  filterStartsWith: 'Începe cu',
  filterEndsWith: 'Se termină cu',
  filterGreaterThan: 'Mai mare decât',
  filterLessThan: 'Mai mic decât',
  filterBetween: 'Între',
  filterBlank: 'Gol',
  filterNotBlank: 'Completat',
  filterApply: 'Aplică',
  filterClear: 'Șterge',
  filterTitle: 'Filtrare',

  // Sort
  sortAscending: 'Sortare crescătoare',
  sortDescending: 'Sortare descrescătoare',
  sortNone: 'Fără sortare',

  // Toolbar
  search: 'Caută',
  searchPlaceholder: 'Caută în toate coloanele...',
  exportExcel: 'Export Excel',
  exportCsv: 'Export CSV',
  exportPdf: 'Export PDF',
  print: 'Printează',
  columnChooser: 'Coloane',

  // Group
  groupPanelPlaceholder: 'Trage o coloană aici pentru a grupa',
  expandAll: 'Expandează tot',
  collapseAll: 'Colapsează tot',

  // Edit
  editSave: 'Salvează',
  editCancel: 'Anulează',
  editDelete: 'Șterge',
  addRow: 'Adaugă rând',
  batchCommit: 'Salvează modificările',
  batchDiscard: 'Anulează modificările',

  // Selection
  selectedCount: 'selectate',
  selectAll: 'Selectează tot',
  deselectAll: 'Deselectează tot',

  // Context menu
  copy: 'Copiază',
  paste: 'Lipește',
  cut: 'Decupează',

  // General
  noData: 'Nu există date de afișat',
  loading: 'Se încarcă...',
  totalRecords: 'Total',
  filteredRecords: 'Filtrate',

  // Column chooser
  columnChooserTitle: 'Selectare coloane',
  columnChooserSearch: 'Caută coloană...',
  columnChooserSelectAll: 'Selectează toate',

  // State
  saveView: 'Salvează vizualizare',
  loadView: 'Încarcă vizualizare',
  resetView: 'Resetează',
  deleteView: 'Șterge vizualizare',
  viewName: 'Numele vizualizării',
}

/** Merge locale custom peste default. */
export function mergeLocaleText(custom?: Partial<GridLocaleText>): GridLocaleText {
  if (!custom) return DEFAULT_LOCALE_TEXT
  return { ...DEFAULT_LOCALE_TEXT, ...custom }
}

/** Formatează o dată conform unui format string simplu. */
export function formatDate(date: unknown, format = 'dd.MM.yyyy'): string {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date as string)
  if (isNaN(d.getTime())) return String(date)

  const pad = (n: number) => String(n).padStart(2, '0')

  return format
    .replace('yyyy', String(d.getFullYear()))
    .replace('MM', pad(d.getMonth() + 1))
    .replace('dd', pad(d.getDate()))
    .replace('HH', pad(d.getHours()))
    .replace('mm', pad(d.getMinutes()))
    .replace('ss', pad(d.getSeconds()))
}

/** Formatează un număr conform Intl options. */
export function formatNumber(value: unknown, options?: Intl.NumberFormatOptions): string {
  if (value === null || value === undefined) return ''
  const num = Number(value)
  if (isNaN(num)) return String(value)
  return new Intl.NumberFormat('ro-RO', options).format(num)
}
