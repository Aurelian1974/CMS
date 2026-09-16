import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/// Afișat cât timp sesiunea se reconstruiește din cookie-ul de refresh.
const SessionLoading = () => (
  <div className="d-flex justify-content-center align-items-center vh-100">
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Se verifică sesiunea...</span>
    </div>
  </div>
)

/// Protejează rutele — redirecționează la /login dacă utilizatorul nu e autentificat.
///
/// Cât timp `isBootstrapping` e adevărat nu știm încă dacă există o sesiune validă:
/// access token-ul trăiește doar în memorie, deci după un reload se cere unul nou pe
/// baza cookie-ului de refresh. Un redirect în acest interval ar deconecta utilizatori
/// perfect valizi la fiecare reîncărcare de pagină.
export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping)

  if (isBootstrapping) return <SessionLoading />

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
