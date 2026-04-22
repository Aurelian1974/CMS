import type { ReactNode } from 'react'
import { IconSearch } from '@/components/ui/Icons'
import styles from './ListPageToolbar.module.scss'

export interface StatusOption<T extends string = string> {
  value: T
  label: string
}

interface ListPageToolbarProps<T extends string = string> {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  statusFilter: T
  onStatusChange: (value: T) => void
  statusOptions: StatusOption<T>[]
  /** Slot pentru filtre suplimentare (specifice paginii) între căutare și pills */
  filters?: ReactNode
}

export const ListPageToolbar = <T extends string = string>({
  search,
  onSearchChange,
  searchPlaceholder = 'Caută...',
  statusFilter,
  onStatusChange,
  statusOptions,
  filters,
}: ListPageToolbarProps<T>) => (
  <div className={styles.toolbar}>
    <div className={styles.searchWrap}>
      <span className={styles.searchIcon}><IconSearch /></span>
      <input
        type="text"
        className={styles.searchInput}
        placeholder={searchPlaceholder}
        value={search}
        onChange={e => onSearchChange(e.target.value)}
      />
    </div>

    {filters}

    <div className={styles.toolbarDivider} />

    <div className={styles.statusPills}>
      {statusOptions.map(opt => (
        <button
          key={opt.value}
          className={`${styles.pill} ${statusFilter === opt.value ? styles.active : ''}`}
          onClick={() => onStatusChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
)
