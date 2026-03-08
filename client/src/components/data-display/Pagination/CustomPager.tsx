import React, { useId } from 'react'
import styles from './CustomPager.module.scss'
import clsx from 'clsx'

export interface CustomPagerProps {
  currentPage: number
  totalRecords: number
  pageSize: number
  pageSizes?: number[]
  onPageChange: (page: number) => void
  onPageSizeChange?: (size: number) => void
  className?: string
}

const DEFAULT_PAGE_SIZES = [5, 10, 20, 50]

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 1) return [Math.max(1, total)]
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (current <= 4) return [1, 2, 3, 4, 5, '...', total]
  if (current >= total - 3) return [1, '...', total - 4, total - 3, total - 2, total - 1, total]
  return [1, '...', current - 1, current, current + 1, '...', total]
}

export const CustomPager: React.FC<CustomPagerProps> = ({
  currentPage,
  totalRecords,
  pageSize,
  pageSizes = DEFAULT_PAGE_SIZES,
  onPageChange,
  onPageSizeChange,
  className,
}) => {
  const selectId = useId()
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize))
  const pageNumbers = getPageNumbers(currentPage, totalPages)
  const startRecord = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endRecord = Math.min(currentPage * pageSize, totalRecords)

  return (
    <div className={clsx(styles.pager, className)}>

      {/* ── Navigare pagini ── */}
      <div className={styles.nav}>
        <button
          type="button"
          className={styles.navBtn}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(1)}
          aria-label="Prima pagină"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="11 17 6 12 11 7" />
            <polyline points="18 17 13 12 18 7" />
          </svg>
        </button>

        <button
          type="button"
          className={styles.navBtn}
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          aria-label="Pagina anterioară"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {pageNumbers.map((p, i) =>
          p === '...' ? (
            <span key={`el-${i}`} className={styles.ellipsis}>…</span>
          ) : (
            <button
              key={p}
              type="button"
              className={clsx(styles.pageBtn, p === currentPage && styles.active)}
              onClick={() => typeof p === 'number' && p !== currentPage && onPageChange(p)}
              aria-label={`Pagina ${p}`}
              aria-current={p === currentPage ? 'page' : undefined}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          className={styles.navBtn}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          aria-label="Pagina următoare"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>

        <button
          type="button"
          className={styles.navBtn}
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(totalPages)}
          aria-label="Ultima pagină"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        </button>
      </div>

      {/* ── Dimensiune pagină + info ── */}
      <div className={styles.right}>
        {onPageSizeChange && (
          <>
            <select
              id={selectId}
              className={styles.sizeSelect}
              value={pageSize}
              onChange={e => onPageSizeChange(Number(e.target.value))}
              aria-label="Înregistrări per pagină"
            >
              {pageSizes.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <label htmlFor={selectId} className={styles.label}>
              înregistrări per pagină
            </label>
            <span className={styles.divider} aria-hidden="true" />
          </>
        )}
        <span className={styles.info}>
          {startRecord}–{endRecord} din {totalRecords}
        </span>
      </div>
    </div>
  )
}
