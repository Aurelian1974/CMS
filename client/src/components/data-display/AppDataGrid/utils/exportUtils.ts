import type { ColDef, ExcelExportParams, PdfExportParams, ExportParams, GroupRow } from '../AppDataGrid.types'
import { getColField, getNestedValue, isGroupRow } from '../AppDataGrid.types'
import { flattenColumns } from './aggregateUtils'

// ═══════════════════════════════════════════════════════════════════════════════
// CSV EXPORT (zero dependințe)
// ═══════════════════════════════════════════════════════════════════════════════

/** Generează CSV string dintr-un set de rânduri. */
export function generateCsv<T extends object>(
  rows: Array<T | GroupRow<T>>,
  columns: ColDef<T>[],
  params?: ExportParams,
): string {
  const visibleCols = getExportColumns(columns, params)
  const headers = params?.customHeaders ?? visibleCols.map(c => c.headerName ?? getColField(c))
  const fields = visibleCols.map(c => getColField(c))

  const lines: string[] = [headers.map(escapeCsvCell).join(',')]

  for (const row of rows) {
    if (isGroupRow(row)) {
      if (params?.includeGroups) {
        const groupRow = row as GroupRow<T>
        lines.push(`"${groupRow.__groupField}: ${String(groupRow.__groupValue)} (${groupRow.__childCount})"`)
      }
      continue
    }

    const cells = fields.map(field => {
      const col = visibleCols.find(c => getColField(c) === field)
      const value = getNestedValue(row, field)
      if (col?.valueFormatter) {
        return escapeCsvCell(col.valueFormatter({ value, data: row as T, colDef: col, field }))
      }
      return escapeCsvCell(value)
    })
    lines.push(cells.join(','))
  }

  return lines.join('\n')
}

/** Descarcă un CSV. */
export function downloadCsv(csvContent: string, fileName: string): void {
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadBlob(blob, `${fileName}.csv`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXCEL EXPORT (ExcelJS — import dinamic)
// ═══════════════════════════════════════════════════════════════════════════════

/** Export Excel stilizat via ExcelJS. */
export async function exportToExcel<T extends object>(
  rows: Array<T | GroupRow<T>>,
  columns: ColDef<T>[],
  params?: ExcelExportParams,
): Promise<void> {
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet(params?.sheetName ?? 'Sheet1')

  const visibleCols = getExportColumns(columns, params)
  const headers = params?.customHeaders ?? visibleCols.map(c => c.headerName ?? getColField(c))
  const fields = visibleCols.map(c => getColField(c))

  // Header row
  const headerRow = worksheet.addRow(headers)
  headerRow.eachCell(cell => {
    cell.font = {
      name: params?.headerStyle?.fontName ?? 'Calibri',
      size: params?.headerStyle?.fontSize ?? 11,
      bold: params?.headerStyle?.bold ?? true,
      color: { argb: (params?.headerStyle?.fontColor ?? 'FFFFFFFF').replace('#', '') },
    }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: (params?.headerStyle?.bgColor ?? 'FF5B8DB8').replace('#', '') },
    }
    cell.alignment = {
      horizontal: params?.headerStyle?.hAlign ?? 'center',
      vertical: params?.headerStyle?.vAlign ?? 'middle',
    }
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    }
  })

  // Data rows
  for (const row of rows) {
    if (isGroupRow(row)) {
      if (params?.includeGroups) {
        const groupRow = row as GroupRow<T>
        const gRow = worksheet.addRow([`${groupRow.__groupField}: ${String(groupRow.__groupValue)} (${groupRow.__childCount})`])
        gRow.font = { bold: true }
        worksheet.mergeCells(gRow.number, 1, gRow.number, fields.length)
      }
      continue
    }

    const values = fields.map(field => {
      const col = visibleCols.find(c => getColField(c) === field)
      const value = getNestedValue(row, field)
      if (col?.clipboardFormatter) {
        return col.clipboardFormatter({ value, data: row as T, colDef: col, field })
      }
      if (col?.valueFormatter) {
        return col.valueFormatter({ value, data: row as T, colDef: col, field })
      }
      return value ?? ''
    })

    const dataRow = worksheet.addRow(values)
    if (params?.cellStyle) {
      dataRow.eachCell(cell => {
        cell.font = {
          name: params.cellStyle?.fontName ?? 'Calibri',
          size: params.cellStyle?.fontSize ?? 10,
        }
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'thin', color: { argb: 'FFE0E0E0' } },
        }
      })
    }
  }

  // Auto-width
  worksheet.columns.forEach((col, i) => {
    let maxLen = headers[i]?.length ?? 10
    worksheet.eachRow((row, rowNum) => {
      if (rowNum === 1) return
      const cell = row.getCell(i + 1)
      const len = cell.value ? String(cell.value).length : 0
      if (len > maxLen) maxLen = len
    })
    col.width = Math.min(maxLen + 4, 50)
  })

  // Download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  const dateStr = new Date().toISOString().slice(0, 10)
  downloadBlob(blob, `${params?.fileName ?? 'export'}_${dateStr}.xlsx`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF EXPORT (jsPDF — import dinamic)
// ═══════════════════════════════════════════════════════════════════════════════

/** Export PDF via jsPDF + jspdf-autotable. */
export async function exportToPdf<T extends object>(
  rows: Array<T | GroupRow<T>>,
  columns: ColDef<T>[],
  params?: PdfExportParams,
): Promise<void> {
  const { default: jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const orientation = params?.orientation ?? 'landscape'
  const doc = new jsPDF({ orientation, unit: 'mm', format: params?.pageSize ?? 'a4' })

  const visibleCols = getExportColumns(columns, params)
  const headers = params?.customHeaders ?? visibleCols.map(c => c.headerName ?? getColField(c))
  const fields = visibleCols.map(c => getColField(c))

  if (params?.title) {
    doc.setFontSize(16)
    doc.text(params.title, 14, 15)
  }

  const body: (string | number)[][] = []
  for (const row of rows) {
    if (isGroupRow(row)) {
      if (params?.includeGroups) {
        const groupRow = row as GroupRow<T>
        body.push([`${groupRow.__groupField}: ${String(groupRow.__groupValue)} (${groupRow.__childCount})`])
      }
      continue
    }

    const cells = fields.map(field => {
      const col = visibleCols.find(c => getColField(c) === field)
      const value = getNestedValue(row, field)
      if (col?.valueFormatter) {
        return col.valueFormatter({ value, data: row as T, colDef: col, field })
      }
      return value !== null && value !== undefined ? String(value) : ''
    })
    body.push(cells)
  }

  autoTable(doc, {
    head: [headers],
    body,
    startY: params?.title ? 22 : 10,
    theme: params?.theme ?? 'striped',
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [91, 141, 184], textColor: [255, 255, 255], fontStyle: 'bold' },
    didDrawPage: (data) => {
      if (params?.footer) {
        doc.setFontSize(8)
        doc.text(params.footer, 14, doc.internal.pageSize.height - 10)
      }
      // Page number
      doc.setFontSize(8)
      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages()
      doc.text(
        `${data.pageNumber} / ${pageCount}`,
        doc.internal.pageSize.width - 20,
        doc.internal.pageSize.height - 10,
      )
    },
  })

  const dateStr = new Date().toISOString().slice(0, 10)
  doc.save(`${params?.fileName ?? 'export'}_${dateStr}.pdf`)
}

// ═══════════════════════════════════════════════════════════════════════════════
// PRINT
// ═══════════════════════════════════════════════════════════════════════════════

/** Printează gridul. */
export function printGrid(gridElement: HTMLElement | null): void {
  if (!gridElement) return

  const printWindow = window.open('', '_blank', 'width=900,height=600')
  if (!printWindow) return

  const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
    .map(el => el.outerHTML)
    .join('\n')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head><title>Print</title>${styles}
    <style>
      body { margin: 20px; }
      @media print { body { margin: 0; } }
    </style>
    </head>
    <body>${gridElement.innerHTML}</body>
    </html>
  `)
  printWindow.document.close()
  printWindow.onload = () => {
    printWindow.print()
    printWindow.close()
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function getExportColumns<T extends object>(columns: ColDef<T>[], params?: ExportParams): ColDef<T>[] {
  const flat = flattenColumns(columns)

  if (params?.columnFields?.length) {
    return params.columnFields
      .map(f => flat.find(c => getColField(c) === f))
      .filter((c): c is ColDef<T> => c !== undefined)
  }

  return flat.filter(c => !c.excludeFromExport && !c.hide)
}

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
