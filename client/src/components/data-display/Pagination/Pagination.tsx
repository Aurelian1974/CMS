import type { PaginationProps } from './Pagination.types'
import { CustomPager } from './CustomPager'

/**
 * Componenta Pagination standalone — pager reutilizabil independent de DataGrid.
 * Wrapper subțire peste CustomPager pentru liste non-grid (card layout, etc.)
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalRecords,
  pageSize,
  pageSizes,
  onPageChange,
  onPageSizeChange,
  className,
}) => {
  if (totalRecords <= 0) return null

  const totalPages = Math.ceil(totalRecords / pageSize)
  if (totalPages <= 1 && !onPageSizeChange) return null

  return (
    <CustomPager
      currentPage={currentPage}
      totalRecords={totalRecords}
      pageSize={pageSize}
      pageSizes={pageSizes}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      className={className}
    />
  )
}
