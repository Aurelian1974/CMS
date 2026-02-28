import { useCallback, type RefObject } from 'react'
import type {
  GridComponent,
  ExcelExportProperties,
  PdfExportProperties,
} from '@syncfusion/ej2-react-grids'
import type { ExportConfig } from './AppDataGrid.types'

/**
 * Hook reutilizabil pentru export Excel / PDF din Syncfusion GridComponent.
 * Gestionează save/restore template-uri JSX (Syncfusion nu le poate serializa).
 */
export const useGridExport = (
  gridRef: RefObject<GridComponent | null>,
  config: ExportConfig,
) => {
  const { fileNamePrefix, buildExportData } = config

  /** Salvează și elimină temporar template-urile JSX de pe coloane. */
  const stripTemplates = useCallback(() => {
    const grid = gridRef.current
    if (!grid) return { columns: [] as Array<Record<string, unknown>>, saved: new Map<string, unknown>() }

    const columns = grid.getColumns() as unknown as Array<Record<string, unknown>>
    const saved = new Map<string, unknown>()
    columns.forEach(col => {
      if (col.template) {
        saved.set(col.field as string, col.template)
        col.template = null
      }
    })
    return { columns, saved }
  }, [gridRef])

  /** Restaurează template-urile JSX salvate anterior. */
  const restoreTemplates = useCallback(
    (columns: Array<Record<string, unknown>>, saved: Map<string, unknown>) => {
      columns.forEach(col => {
        const key = col.field as string
        if (saved.has(key)) col.template = saved.get(key)
      })
      gridRef.current?.refreshColumns()
    },
    [gridRef],
  )

  /** Export Excel cu date plain-object, fără template-uri JSX. */
  const handleExcelExport = useCallback(() => {
    const grid = gridRef.current
    if (!grid) return

    const { columns, saved } = stripTemplates()
    const dateStr = new Date().toISOString().slice(0, 10)

    const props: ExcelExportProperties = {
      fileName: `${fileNamePrefix}_${dateStr}.xlsx`,
      dataSource: buildExportData(),
    }

    const restore = () => restoreTemplates(columns, saved)
    const result = grid.excelExport(props) as unknown as Promise<unknown>
    result?.then?.(restore).catch((err: unknown) => {
      console.error('Excel export error:', err)
      restore()
    })
  }, [gridRef, fileNamePrefix, buildExportData, stripTemplates, restoreTemplates])

  /** Export PDF landscape cu date plain-object, fără template-uri JSX. */
  const handlePdfExport = useCallback(() => {
    const grid = gridRef.current
    if (!grid) return

    const { columns, saved } = stripTemplates()
    const dateStr = new Date().toISOString().slice(0, 10)

    const props: PdfExportProperties = {
      fileName: `${fileNamePrefix}_${dateStr}.pdf`,
      pageOrientation: 'Landscape',
      dataSource: buildExportData(),
      theme: {
        header: { bold: true, fontColor: '#ffffff', fontName: 'Helvetica', fontSize: 10 },
        record: { fontName: 'Helvetica', fontSize: 9 },
      },
    }

    const restore = () => restoreTemplates(columns, saved)
    const result = grid.pdfExport(props) as unknown as Promise<unknown>
    result?.then?.(restore).catch((err: unknown) => {
      console.error('PDF export error:', err)
      restore()
    })
  }, [gridRef, fileNamePrefix, buildExportData, stripTemplates, restoreTemplates])

  return { handleExcelExport, handlePdfExport }
}
