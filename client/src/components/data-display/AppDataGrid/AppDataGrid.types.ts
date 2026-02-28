import type { ReactNode, Ref } from 'react'
import type { GridComponent, RecordClickEventArgs, SortSettingsModel } from '@syncfusion/ej2-react-grids'

/** Props pentru componenta AppDataGrid — wrapper standardizat peste Syncfusion GridComponent. */
export interface AppDataGridProps<T extends object = object> {
  /** Datele afișate în grid. */
  dataSource: T[]

  /** Coloanele grid-ului — se transmit ca `<ColumnsDirective>` children. */
  children: ReactNode

  /** Setări sortare inițiale. Default: field="fullName", direction="Ascending". */
  sortSettings?: SortSettingsModel

  /** Ref spre GridComponent intern — necesar pentru export, openColumnChooser, etc. */
  gridRef?: Ref<GridComponent>

  /** Clasă CSS suplimentară pe containerul wrapper. */
  className?: string

  /** Înălțimea grid-ului. Default: "auto". */
  height?: string | number

  /** Înălțimea rândului în px. Default: 52. */
  rowHeight?: number

  /** Handler click pe rând — navigare la detalii. */
  recordClick?: (args: RecordClickEventArgs) => void
}

/** Parametri pentru funcțiile helper de export. */
export interface ExportConfig {
  /** Numele fișierului fără extensie (ex: "pacienti"). Se adaugă automat data + extensie. */
  fileNamePrefix: string

  /** Funcție care returnează date plain-object pentru export (fără JSX templates). */
  buildExportData: () => Record<string, unknown>[]
}
