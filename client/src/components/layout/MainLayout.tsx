import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AppHeader } from './AppHeader'
import { PageTabs } from './PageTabs'
import { usePageHistoryStore } from '@/store/pageHistoryStore'
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
      <Sidebar />
      <div className={styles.content}>
        <AppHeader />
        <PageTabs />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
