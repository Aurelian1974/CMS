import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'
import { useSessionBootstrap } from './features/auth/hooks/useSessionBootstrap'
import { ErrorBoundary } from './components/ui/ErrorBoundary'

// Verificarea manuală a expirării JWT-ului de la pornire a fost eliminată: era
// necesară doar pentru că access token-ul se persista în sessionStorage și putea
// fi expirat la reîncărcare. Acum token-ul trăiește doar în memorie, iar sesiunea
// se reconstruiește prin /refresh — vezi useSessionBootstrap.

// Data router: necesar pentru useBlocker (gardă la modificări nesalvate).
// Rutele rămân declarate în <AppRoutes> și sunt montate sub un singur splat.
const router = createBrowserRouter(
  [{ path: '*', element: <AppRoutes /> }],
  { future: { v7_relativeSplatPath: true } },
)

function App() {
  useSessionBootstrap()

  return (
    <ErrorBoundary label="aplicație" variant="page">
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </ErrorBoundary>
  )
}

export default App
