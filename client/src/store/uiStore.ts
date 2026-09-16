import { create } from 'zustand'

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

export const useUiStore = create<UiState>()((set) => ({
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
}))
