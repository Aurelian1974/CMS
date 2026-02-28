import { PagerComponent } from '@syncfusion/ej2-react-grids'
import type { PaginationProps } from './Pagination.types'
import styles from './Pagination.module.scss'
import clsx from 'clsx'

const DEFAULT_PAGE_SIZES = [5, 10, 20, 50]

/**
 * Componenta Pagination standalone — pager reutilizabil independent de DataGrid.
 * Folosește Syncfusion PagerComponent cu stiluri consistente cu grid-ul.
 * Se folosește pentru liste non-grid (card layout, mobile etc.)
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalRecords,
  pageSize,
  pageSizes = DEFAULT_PAGE_SIZES,
  onPageChange,
  onPageSizeChange,
  className,
}) => {
  if (totalRecords <= 0) return null

  const totalPages = Math.ceil(totalRecords / pageSize)
  if (totalPages <= 1 && !onPageSizeChange) return null

  return (
    <div className={clsx(styles.paginationContainer, className)}>
      <PagerComponent
        currentPage={currentPage}
        totalRecordsCount={totalRecords}
        pageSize={pageSize}
        pageCount={5}
        pageSizes={pageSizes}
        click={(e) => {
          if (e.currentPage !== currentPage) {
            onPageChange(e.currentPage)
          }
          if (onPageSizeChange && e.pageSize !== pageSize) {
            onPageSizeChange(e.pageSize)
          }
        }}
      />
    </div>
  )
}
