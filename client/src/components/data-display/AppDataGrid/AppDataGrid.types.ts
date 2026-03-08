import type { ReactNode, Ref } from 'react'
import type { GridComponent, RecordClickEventArgs, SortSettingsModel } from '@syncfusion/ej2-react-grids'

/**
 * Starea curentă a grid-ului transmisă la orice acțiune server-side
 * (paginare, sortare, grupare, filtrare).
 * Corespunde argumentelor evenimentului `dataStateChange` din Syncfusion.
 */
export interface GridServerState {
  /** Număr de înregistrări de sărit (0-based). Pagina = skip/take + 1. */
  skip: number
  /** Dimensiunea paginii (înregistrări per pagină). */
  take: number
  /** Coloane sortate. Fiecare element are `name` (câmpul) și `direction` ('ascending'|'descending'). */
  sorted?: Array<{ name?: string; field?: string; direction: string }>
  /** Predicatele de filtrare din coloane (rezervat pentru viitor). */
  where?: unknown[]
  /** Câmpurile grupate (rezervat pentru viitor). */
  group?: string[]
}

/** Props pentru componenta AppDataGrid — wrapper standardizat peste Syncfusion GridComponent. */
export interface AppDataGridProps<T extends object = object> {
  /** Datele afișate în grid (pagina curentă în mod server-side). */
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

  // ── Mod server-side (paginare/sortare/grupare la API) ─────────────────────

  /**
   * Numărul TOTAL de înregistrări din baza de date (nu doar pagina curentă).
   * Când e setat împreună cu `onDataStateChange`, activează modul server-side:
   * Syncfusion trackează starea intern și emite `dataStateChange` la orice
   * acțiune (pagina, sortare, grupare). CustomPager afișează totalul corect.
   */
  serverSideCount?: number

  /**
   * Callback declanșat la orice acțiune grid în mod server-side:
   * schimbare pagină, sortare coloană, grupare.
   * Primește `GridServerState` cu skip/take/sorted/group.
   * Prezența acestui prop activează modul server-side.
   */
  onDataStateChange?: (state: GridServerState) => void

  /**
   * Dimensiunea paginii la inițializare în mod server-side. Default: 20.
   * Nu afectează modul client-side.
   */
  initialPageSize?: number
}

/** Parametri pentru funcțiile helper de export. */
export interface ExportConfig {
  /** Numele fișierului fără extensie (ex: "pacienti"). Se adaugă automat data + extensie. */
  fileNamePrefix: string

  /** Funcție care returnează date plain-object pentru export (fără JSX templates). */
  buildExportData: () => Record<string, unknown>[]
}

/** Parametri pentru funcțiile helper de export. */
export interface ExportConfig {
  /** Numele fișierului fără extensie (ex: "pacienti"). Se adaugă automat data + extensie. */
  fileNamePrefix: string

  /** Funcție care returnează date plain-object pentru export (fără JSX templates). */
  buildExportData: () => Record<string, unknown>[]
}
