import type { ToolbarItem } from '../AppDataGrid.types'

/** Generează toolbar items implicite bazate pe props booleene. */
export function getDefaultToolbarItems(showSearch: boolean): ToolbarItem[] {
  const items: ToolbarItem[] = []

  if (showSearch) {
    items.push({ id: 'search', type: 'search', align: 'left' })
  }

  items.push({ id: 'export-excel', type: 'export-excel', align: 'right' })
  items.push({ id: 'export-csv', type: 'export-csv', align: 'right' })
  items.push({ id: 'export-pdf', type: 'export-pdf', align: 'right' })
  items.push({ id: 'print', type: 'print', align: 'right' })
  items.push({ id: 'sep-1', type: 'separator', align: 'right' })
  items.push({ id: 'column-chooser', type: 'column-chooser', align: 'right' })

  return items
}
