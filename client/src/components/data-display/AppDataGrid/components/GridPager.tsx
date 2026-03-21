import { useMemo } from 'react'
import type { GridLocaleText } from '../AppDataGrid.types'
import { DEFAULT_LOCALE_TEXT } from '../utils/localeUtils'

export interface GridPagerProps {
  page: number
  pageSize: number
  totalCount: number
  filteredCount: number
  pageSizes?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange: (pageSize: number) => void
  localeText?: Partial<GridLocaleText>
}

export function GridPager(props: GridPagerProps) {
  const {
    page, pageSize, totalCount, filteredCount,
    pageSizes = [10, 20, 50, 100],
    onPageChange, onPageSizeChange,
    localeText,
  } = props

  const locale = { ...DEFAULT_LOCALE_TEXT, ...localeText }
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize))
  const startItem = filteredCount === 0 ? 0 : (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, filteredCount)

  const pageNumbers = useMemo(() => {
    const pages: (number | '...')[] = []
    const maxVisible = 7

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')

      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)

      for (let i = start; i <= end; i++) pages.push(i)

      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }

    return pages
  }, [page, totalPages])

  return (
    <div className="adg-pager" role="navigation" aria-label="Pagination">
      {/* Items per page */}
      <div className="adg-pager__size">
        <label className="adg-pager__size-label">
          {locale.itemsPerPage}:
          <select
            className="adg-pager__size-select"
            value={pageSize}
            onChange={e => onPageSizeChange(Number(e.target.value))}
          >
            {pageSizes.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Info */}
      <div className="adg-pager__info">
        {startItem}–{endItem} {locale.of} {filteredCount}
        {filteredCount < totalCount && (
          <span className="adg-pager__filtered"> (filtrate din {totalCount})</span>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="adg-pager__nav">
        <button
          className="adg-pager__btn"
          disabled={page <= 1}
          onClick={() => onPageChange(1)}
          title={locale.firstPage}
          aria-label={locale.firstPage}
        >
          «
        </button>
        <button
          className="adg-pager__btn"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          title={locale.previousPage}
          aria-label={locale.previousPage}
        >
          ‹
        </button>

        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span key={`ellipsis-${i}`} className="adg-pager__ellipsis">…</span>
          ) : (
            <button
              key={p}
              className={`adg-pager__btn adg-pager__btn--page ${p === page ? 'adg-pager__btn--active' : ''}`}
              onClick={() => onPageChange(p)}
              aria-current={p === page ? 'page' : undefined}
            >
              {p}
            </button>
          )
        )}

        <button
          className="adg-pager__btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          title={locale.nextPage}
          aria-label={locale.nextPage}
        >
          ›
        </button>
        <button
          className="adg-pager__btn"
          disabled={page >= totalPages}
          onClick={() => onPageChange(totalPages)}
          title={locale.lastPage}
          aria-label={locale.lastPage}
        >
          »
        </button>
      </div>
    </div>
  )
}
