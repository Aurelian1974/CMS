import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  fullName: string
  role: 'Admin' | 'Doctor' | 'Nurse' | 'Receptionist' | 'ClinicManager'
  clinicId: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  isAuthenticated: boolean
  setAuth: (user: AuthUser, token: string) => void
  updateToken: (token: string) => void
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
      isAuthenticated: false,

      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true }),

      updateToken: (accessToken) =>
        set({ accessToken }),

      clearAuth: () =>
        set({ user: null, accessToken: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
