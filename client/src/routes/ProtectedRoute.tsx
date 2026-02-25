import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/// Protejează rutele — redirecționează la /login dacă utilizatorul nu e autentificat.
export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}
