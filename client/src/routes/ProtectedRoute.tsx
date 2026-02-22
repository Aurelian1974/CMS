import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/// Protejează rutele — redirecționează la /login dacă utilizatorul nu e autentificat.
/// DEV: bypass temporar activat pentru preview UI
const DEV_BYPASS_AUTH = true;

export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return (DEV_BYPASS_AUTH || isAuthenticated) ? <Outlet /> : <Navigate to="/login" replace />
}
