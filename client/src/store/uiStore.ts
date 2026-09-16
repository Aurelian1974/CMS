import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UiState {
  sidebarCollapsed: boolean
  activeNotifications: number
  /** Modalul de schimbare a propriei parole — deschis din sidebar, randat în MainLayout. */
  ownPasswordModalOpen: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setNotificationCount: (count: number) => void
  openOwnPasswordModal: () => void
  closeOwnPasswordModal: () => void
}

/// Store UI — persistă doar preferințele de interfață, nu date de sesiune.
/// `sidebarCollapsed` e salvat în localStorage ca să supraviețuiască reload-ului;
/// notificările și starea modalului rămân în memorie.
export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      activeNotifications: 0,
      ownPasswordModalOpen: false,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }),

      setNotificationCount: (count) =>
        set({ activeNotifications: count }),

      openOwnPasswordModal: () => set({ ownPasswordModalOpen: true }),

      closeOwnPasswordModal: () => set({ ownPasswordModalOpen: false }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
)
