import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AppHeader } from './AppHeader'
import { PageTabs } from './PageTabs'
import { usePageHistoryStore } from '@/store/pageHistoryStore'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import styles from './MainLayout.module.scss'

export const MainLayout = () => {
  const location = useLocation()
  const push = usePageHistoryStore((s) => s.push)

  // Înregistrează fiecare navigare în istoric
  useEffect(() => {
    push(location.pathname)
  }, [location.pathname, push])

  return (
    <div className={styles.layout}>
      <ErrorBoundary variant="section" label="sidebar">
        <Sidebar />
      </ErrorBoundary>
      <div className={styles.content}>
        <AppHeader />
        <PageTabs />
        <main className={styles.main}>
          <ErrorBoundary key={location.pathname} variant="page" label="pagină">
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

export default MainLayout
