import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { AuthUser, ModulePermission } from '@/features/auth/types/auth.types'

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  permissions: ModulePermission[]
  isAuthenticated: boolean
  /**
   * Adevărat cât timp încercăm să reconstruim sesiunea din cookie-ul de refresh,
   * la încărcarea paginii. Distinge „neautentificat" de „încă nu știm", ca
   * ProtectedRoute să nu redirecționeze greșit către /login.
   */
  isBootstrapping: boolean
  setAuth: (user: AuthUser, token: string, permissions: ModulePermission[]) => void
  updateToken: (token: string) => void
  updatePermissions: (permissions: ModulePermission[]) => void
  clearMustChangePassword: () => void
  finishBootstrap: () => void
  clearAuth: () => void
}

/// Store Zustand pentru autentificare.
///
/// Access token-ul trăiește DOAR în memorie — nu e persistat nicăieri, deci un XSS
/// nu îl poate citi din storage. La reîncărcarea paginii sesiunea se reconstruiește
/// printr-un apel /refresh: cookie-ul HttpOnly e singura sursă de adevăr pentru
/// continuitatea sesiunii, iar el nu e accesibil din JavaScript.
///
/// `user` și `permissions` rămân persistate — nu sunt credențiale, iar păstrarea lor
/// evită un ecran gol cât durează apelul de refresh.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      permissions: [],
      isAuthenticated: false,
      isBootstrapping: true,

      setAuth: (user, accessToken, permissions) =>
        set({ user, accessToken, permissions, isAuthenticated: true }),

      updateToken: (accessToken) =>
        set({ accessToken }),

      updatePermissions: (permissions) =>
        set({ permissions }),

      finishBootstrap: () => set({ isBootstrapping: false }),

      clearMustChangePassword: () =>
        set((state) =>
          state.user ? { user: { ...state.user, mustChangePassword: false } } : {}
        ),

      clearAuth: () =>
        set({
          user: null, accessToken: null, permissions: [],
          isAuthenticated: false, isBootstrapping: false,
        }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      // accessToken lipseste intentionat: vezi comentariul de mai sus.
      partialize: (state) => ({
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
