import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'
import { useAuthStore } from './store/authStore'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

// ===== Validare sesiune la startup =====
// Dacă JWT-ul stocat în sessionStorage e expirat, curățăm sesiunea înainte de render.
// Previne ciclul: pagini protejate → 401 → refresh eșuat → redirect → eroare inutilă.
;(() => {
  const { accessToken, isAuthenticated, clearAuth } = useAuthStore.getState()
  if (!isAuthenticated || !accessToken) return

  try {
    const payload = JSON.parse(atob(accessToken.split('.')[1]))
    const expMs = (payload.exp ?? 0) * 1000
    if (Date.now() > expMs) {
      clearAuth()
    }
  } catch {
    // Token malformat — curățăm sesiunea
    clearAuth()
  }
})()

function App() {
  return (
    <ErrorBoundary label="aplicație" variant="page">
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
