import { useCallback } from 'react'
import type {
  ColDef, GroupRow, ExcelExportParams, PdfExportParams, ExportParams,
} from '../AppDataGrid.types'
import { isGroupRow } from '../AppDataGrid.types'
import { exportToExcel, exportToPdf, generateCsv, downloadCsv, printGrid } from '../utils/exportUtils'
import { copyToClipboard, rowsToTsv } from '../utils/clipboardUtils'
import { getColField } from '../AppDataGrid.types'
import { flattenColumns } from '../utils/aggregateUtils'

export interface UseGridExportOptions<T extends object> {
  columnDefs: ColDef<T>[]
  defaultExcelExportParams?: ExcelExportParams
  defaultCsvExportParams?: ExportParams
  defaultPdfExportParams?: PdfExportParams
  getSelectedRows: () => T[]
  getDisplayedRows: () => Array<T | GroupRow<T>>
  getAllRows: () => T[]
  gridRef: React.RefObject<HTMLDivElement | null>
}

export interface UseGridExportReturn {
  exportExcel: (params?: ExcelExportParams) => Promise<void>
  exportCsv: (params?: ExportParams) => void
  exportPdf: (params?: PdfExportParams) => Promise<void>
  print: () => void
  copySelectionToClipboard: () => Promise<void>
}

export function useGridExport<T extends object>(options: UseGridExportOptions<T>): UseGridExportReturn {
  const {
    columnDefs,
    defaultExcelExportParams,
    defaultCsvExportParams,
    defaultPdfExportParams,
    getSelectedRows,
    getDisplayedRows,
    getAllRows: _getAllRows,
    gridRef,
  } = options

  const getExportRows = useCallback((params?: ExportParams): Array<T | GroupRow<T>> => {
    if (params?.onlySelected) {
      return getSelectedRows()
    }
    return getDisplayedRows()
  }, [getSelectedRows, getDisplayedRows])

  const exportExcel = useCallback(async (params?: ExcelExportParams) => {
    const merged = { ...defaultExcelExportParams, ...params }
    const rows = getExportRows(merged)
    await exportToExcel(rows, columnDefs, merged)
  }, [columnDefs, defaultExcelExportParams, getExportRows])

  const exportCsvAction = useCallback((params?: ExportParams) => {
    const merged = { ...defaultCsvExportParams, ...params }
    const rows = getExportRows(merged)
    const csv = generateCsv(rows, columnDefs, merged)
    const dateStr = new Date().toISOString().slice(0, 10)
    downloadCsv(csv, `${merged.fileName ?? 'export'}_${dateStr}`)
  }, [columnDefs, defaultCsvExportParams, getExportRows])

  const exportPdfAction = useCallback(async (params?: PdfExportParams) => {
    const merged = { ...defaultPdfExportParams, ...params }
    const rows = getExportRows(merged)
    await exportToPdf(rows, columnDefs, merged)
  }, [columnDefs, defaultPdfExportParams, getExportRows])

  const printAction = useCallback(() => {
    printGrid(gridRef.current)
  }, [gridRef])

  const copySelectionToClipboard = useCallback(async () => {
    const selected = getSelectedRows()
    if (!selected.length) return

    const flat = flattenColumns(columnDefs)
    const fields = flat
      .filter(c => !c.hide && !c.excludeFromExport)
      .map(c => getColField(c))
      .filter(Boolean)

    const headers = flat
      .filter(c => !c.hide && !c.excludeFromExport)
      .map(c => c.headerName ?? getColField(c))

    const plainRows = selected.filter(r => !isGroupRow(r)) as Record<string, unknown>[]
    const tsv = rowsToTsv(plainRows, fields, headers)
    await copyToClipboard(tsv)
  }, [getSelectedRows, columnDefs])

  return {
    exportExcel,
    exportCsv: exportCsvAction,
    exportPdf: exportPdfAction,
    print: printAction,
    copySelectionToClipboard,
  }
}
