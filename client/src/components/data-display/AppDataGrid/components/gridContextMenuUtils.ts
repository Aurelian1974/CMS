import type { ContextMenuItem } from '../AppDataGrid.types'

/** Returnează meniul de context implicit. */
export function getDefaultContextMenuItems(): ContextMenuItem[] {
  return [
    { id: 'copy', text: 'Copiază', action: (p) => p.api?.copyToClipboard?.() },
    { id: 'sep-1', text: '', separator: true },
    { id: 'export-excel', text: 'Export Excel', action: (p) => p.api?.exportExcel?.() },
    { id: 'export-csv', text: 'Export CSV', action: (p) => p.api?.exportCsv?.() },
    { id: 'export-pdf', text: 'Export PDF', action: (p) => p.api?.exportPdf?.() },
  ]
}
