import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { ModulePermission } from '@/features/auth/types/auth.types'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: 'admin' | 'doctor' | 'nurse' | 'receptionist' | 'clinic_manager'
  roleId: string
  clinicId: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  permissions: ModulePermission[]
  isAuthenticated: boolean
  setAuth: (user: AuthUser, token: string, permissions: ModulePermission[]) => void
  updateToken: (token: string) => void
  updatePermissions: (permissions: ModulePermission[]) => void
  clearAuth: () => void
}

/// Store Zustand pentru autentificare.
/// Access token stocat în sessionStorage (nu localStorage) din motive de securitate.
/// Refresh token e HttpOnly cookie — nu apare în JavaScript.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      permissions: [],
      isAuthenticated: false,

      setAuth: (user, accessToken, permissions) =>
        set({ user, accessToken, permissions, isAuthenticated: true }),

      updateToken: (accessToken) =>
        set({ accessToken }),

      updatePermissions: (permissions) =>
        set({ permissions }),

      clearAuth: () =>
        set({ user: null, accessToken: null, permissions: [], isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
