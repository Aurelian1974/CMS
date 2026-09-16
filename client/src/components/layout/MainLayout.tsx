import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { AppHeader } from './AppHeader'
import { PageTabs } from './PageTabs'
import { usePageHistoryStore } from '@/store/pageHistoryStore'
import { useUiStore } from '@/store/uiStore'
import { useAuthStore } from '@/store/authStore'
import { useChangeOwnPassword } from '@/features/users/hooks/useUsers'
import { useIdleTimeout } from '@/features/auth/hooks/useIdleTimeout'
import { IdleWarningModal } from '@/features/auth/components/IdleWarningModal'
import { ChangeOwnPasswordModal } from '@/features/users/components/ChangeOwnPasswordModal/ChangeOwnPasswordModal'
import type { ChangeOwnPasswordFormData } from '@/features/users/schemas/user.schema'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import styles from './MainLayout.module.scss'

export const MainLayout = () => {
  const location = useLocation()
  const push = usePageHistoryStore((s) => s.push)

  const modalOpen = useUiStore((s) => s.ownPasswordModalOpen)
  const closeModal = useUiStore((s) => s.closeOwnPasswordModal)
  const mustChangePassword = useAuthStore((s) => s.user?.mustChangePassword ?? false)
  const clearMustChangePassword = useAuthStore((s) => s.clearMustChangePassword)
  const changeOwnPassword = useChangeOwnPassword()
  const [passwordError, setPasswordError] = useState<string | null>(null)

  // Deconectarea pentru inactivitate se montează aici, nu în App: are nevoie de
  // context de rutare și privește doar zona autentificată a aplicației.
  const { secondsLeft, staySignedIn } = useIdleTimeout()

  // Înregistrează fiecare navigare în istoric
  useEffect(() => {
    push(location.pathname)
  }, [location.pathname, push])

  // După un reset administrativ, parola e cunoscută de altcineva: modalul se
  // deschide singur și nu poate fi închis până la schimbare.
  const forced = mustChangePassword

  const handlePasswordSubmit = (data: ChangeOwnPasswordFormData) => {
    setPasswordError(null)
    changeOwnPassword.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          clearMustChangePassword()
          closeModal()
        },
        onError: (err: Error) => setPasswordError(err.message),
      },
    )
  }

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

      <IdleWarningModal secondsLeft={secondsLeft} onStay={staySignedIn} />

      <ChangeOwnPasswordModal
        isOpen={modalOpen || forced}
        forced={forced}
        onClose={() => { setPasswordError(null); closeModal() }}
        onSubmit={handlePasswordSubmit}
        isLoading={changeOwnPassword.isPending}
        serverError={passwordError}
      />
    </div>
  )
}

export default MainLayout
