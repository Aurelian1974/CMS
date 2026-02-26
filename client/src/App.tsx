import { Component, type ReactNode } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'
import { useAuthStore } from './store/authStore'

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

// Error Boundary temporar pentru debug — afișează eroarea în loc de blank page
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error
      return (
        <div style={{ padding: '2rem', fontFamily: 'monospace', color: 'red', background: '#fff' }}>
          <h2>⛔ React Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {err.message}{'\n\n'}{err.stack}
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
