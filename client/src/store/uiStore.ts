import { create } from 'zustand'

interface UiState {
  sidebarCollapsed: boolean
  activeNotifications: number
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setNotificationCount: (count: number) => void
}

export const useUiStore = create<UiState>()((set) => ({
  sidebarCollapsed: false,
  activeNotifications: 0,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) =>
    set({ sidebarCollapsed: collapsed }),

  setNotificationCount: (count) =>
    set({ activeNotifications: count }),
}))
