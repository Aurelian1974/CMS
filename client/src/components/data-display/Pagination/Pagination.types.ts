/// Tipuri pentru componenta Pagination — pager standalone reutilizabil

export interface PaginationProps {
  /** Pagina curentă (1-based) */
  currentPage: number
  /** Numărul total de înregistrări */
  totalRecords: number
  /** Dimensiunea paginii */
  pageSize: number
  /** Opțiuni dimensiune pagină (dropdown) — default [5, 10, 20, 50] */
  pageSizes?: number[]
  /** Callback la schimbarea paginii */
  onPageChange: (page: number) => void
  /** Callback la schimbarea dimensiunii paginii */
  onPageSizeChange?: (pageSize: number) => void
  /** Clasă CSS suplimentară */
  className?: string
}
