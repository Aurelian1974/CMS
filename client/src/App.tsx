import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'
import { useSessionBootstrap } from './features/auth/hooks/useSessionBootstrap'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

// Verificarea manuală a expirării JWT-ului de la pornire a fost eliminată: era
// necesară doar pentru că access token-ul se persista în sessionStorage și putea
// fi expirat la reîncărcare. Acum token-ul trăiește doar în memorie, iar sesiunea
// se reconstruiește prin /refresh — vezi useSessionBootstrap.

function App() {
  useSessionBootstrap()

  return (
    <ErrorBoundary label="aplicație" variant="page">
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
