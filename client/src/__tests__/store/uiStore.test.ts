/**
 * Teste unitare pentru store/uiStore.ts
 * Verifică persistența preferințelor de UI și izolarea datelor de sesiune.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useUiStore } from '@/store/uiStore';

function resetStore() {
  useUiStore.setState({
    sidebarCollapsed: false,
    activeNotifications: 0,
    ownPasswordModalOpen: false,
  });
}

describe('uiStore', () => {
  beforeEach(() => {
    localStorage.clear();
    resetStore();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('salvează starea collapsed în localStorage', () => {
    useUiStore.getState().toggleSidebar();
    expect(useUiStore.getState().sidebarCollapsed).toBe(true);

    const stored = localStorage.getItem('ui-storage');
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.state.sidebarCollapsed).toBe(true);
  });

  it('nu persistă notificările sau starea modalului', () => {
    useUiStore.getState().setNotificationCount(5);
    useUiStore.getState().openOwnPasswordModal();

    const stored = localStorage.getItem('ui-storage');
    expect(stored).not.toBeNull();

    const parsed = JSON.parse(stored!);
    expect(parsed.state).not.toHaveProperty('activeNotifications');
    expect(parsed.state).not.toHaveProperty('ownPasswordModalOpen');
  });
});
