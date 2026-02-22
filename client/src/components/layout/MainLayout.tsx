import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AppHeader } from './AppHeader'
import styles from './MainLayout.module.scss'

export const MainLayout = () => (
  <div className={styles.layout}>
    <Sidebar />
    <div className={styles.content}>
      <AppHeader />
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  </div>
)

export default MainLayout
