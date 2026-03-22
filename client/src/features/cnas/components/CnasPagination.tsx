import styles from '../pages/CnasPage.module.scss'

interface Props {
  page: number
  totalPages: number
  totalCount: number
  onPrev: () => void
  onNext: () => void
}

export const CnasPagination = ({ page, totalPages, totalCount, onPrev, onNext }: Props) => (
  <div className={styles.pagination}>
    <span className={styles.pageInfo}>{totalCount.toLocaleString()} înregistrări</span>
    <button
      className="btn btn-sm btn-outline-secondary"
      onClick={onPrev}
      disabled={page <= 1}
    >
      ‹
    </button>
    <span className={styles.pageInfo}>
      {page} / {totalPages || 1}
    </span>
    <button
      className="btn btn-sm btn-outline-secondary"
      onClick={onNext}
      disabled={page >= totalPages}
    >
      ›
    </button>
  </div>
)
