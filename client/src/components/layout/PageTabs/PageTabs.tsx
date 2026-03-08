import { useNavigate, useLocation } from 'react-router-dom'
import { usePageHistoryStore } from '@/store/pageHistoryStore'
import styles from './PageTabs.module.scss'

const IconClose = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
)

export const PageTabs = () => {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { history, remove } = usePageHistoryStore()

  // Sortăm: cel mai recent vizitat = primul tab
  const sorted = [...history].sort((a, b) => b.visitedAt - a.visitedAt)

  if (sorted.length === 0) return null

  const handleClose = (e: React.MouseEvent, path: string) => {
    e.stopPropagation()
    remove(path)

    // Dacă închidem tab-ul activ, navigăm la primul rămas
    if (location.pathname === path) {
      const remaining = sorted.filter((e) => e.path !== path)
      navigate(remaining.length > 0 ? remaining[0].path : '/dashboard')
    }
  }

  return (
    <nav className={styles.tabs} aria-label="Istoric pagini">
      {sorted.map((entry) => {
        const isActive = location.pathname === entry.path
        return (
          <div
            key={entry.path}
            className={`${styles.tab} ${isActive ? styles.active : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => navigate(entry.path)}
            onKeyDown={(e) => e.key === 'Enter' && navigate(entry.path)}
            title={entry.label}
          >
            <span className={styles.label}>{entry.label}</span>
            <button
              type="button"
              className={styles.closeBtn}
              onClick={(e) => handleClose(e, entry.path)}
              aria-label={`Închide ${entry.label}`}
            >
              <IconClose />
            </button>
          </div>
        )
      })}
    </nav>
  )
}
