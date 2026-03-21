/**
 * Teste unitare pentru store/authStore.ts
 * Verifică toate acțiunile Zustand: setAuth, updateToken, updatePermissions, clearAuth.
 * Testele manipulează store-ul direct (fără React renderer) — Zustand permite getState/setState.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore, type AuthUser } from '@/store/authStore';
import type { ModulePermission } from '@/features/auth/types/auth.types';

// ── Date mock ─────────────────────────────────────────────────────────────────

const mockUser: AuthUser = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  email: 'admin@valyan.ro',
  fullName: 'Admin Valyan',
  role: 'admin',
  roleId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  clinicId: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
};

const mockPermissions: ModulePermission[] = [
  { module: 'patients',  level: 3, isOverridden: false },
  { module: 'users',     level: 3, isOverridden: false },
  { module: 'dashboard', level: 1, isOverridden: true  },
];

const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test';

// ── Helper: resetează store-ul la starea inițială ────────────────────────────

function resetStore() {
  useAuthStore.setState({
    user: null,
    accessToken: null,
    permissions: [],
    isAuthenticated: false,
  });
}

// ── Teste ─────────────────────────────────────────────────────────────────────

describe('authStore', () => {
  beforeEach(() => {
    resetStore();
  });

  // ── Stare inițială ─────────────────────────────────────────────────────────

  describe('stare inițială', () => {
    it('user este null', () => {
      expect(useAuthStore.getState().user).toBeNull();
    });

    it('accessToken este null', () => {
      expect(useAuthStore.getState().accessToken).toBeNull();
    });

    it('permissions este array gol', () => {
      expect(useAuthStore.getState().permissions).toEqual([]);
    });

    it('isAuthenticated este false', () => {
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  // ── setAuth ────────────────────────────────────────────────────────────────

  describe('setAuth', () => {
    it('setează user-ul corect', () => {
      useAuthStore.getState().setAuth(mockUser, MOCK_TOKEN, mockPermissions);
      expect(useAuthStore.getState().user).toEqual(mockUser);
    });

    it('setează accessToken-ul', () => {
      useAuthStore.getState().setAuth(mockUser, MOCK_TOKEN, mockPermissions);
      expect(useAuthStore.getState().accessToken).toBe(MOCK_TOKEN);
    });

    it('setează permisiunile', () => {
      useAuthStore.getState().setAuth(mockUser, MOCK_TOKEN, mockPermissions);
      expect(useAuthStore.getState().permissions).toEqual(mockPermissions);
    });

    it('setează isAuthenticated la true', () => {
      useAuthStore.getState().setAuth(mockUser, MOCK_TOKEN, mockPermissions);
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
    });

    it('funcționează cu array de permisiuni gol', () => {
      useAuthStore.getState().setAuth(mockUser, MOCK_TOKEN, []);
      const state = useAuthStore.getState();
      expect(state.permissions).toEqual([]);
      expect(state.isAuthenticated).toBe(true);
    });
  });

  // ── updateToken ────────────────────────────────────────────────────────────

  describe('updateToken', () => {
    it('actualizează doar token-ul, nu restul stării', () => {
      useAuthStore.getState().setAuth(mockUser, MOCK_TOKEN, mockPermissions);
      useAuthStore.getState().updateToken('new-jwt-token');

      const state = useAuthStore.getState();
      expect(state.accessToken).toBe('new-jwt-token');
      expect(state.user).toEqual(mockUser);         // neschimbat
      expect(state.permissions).toEqual(mockPermissions); // neschimbat
      expect(state.isAuthenticated).toBe(true);          // neschimbat
    });

    it('actualizează de multiple ori corect', () => {
      useAuthStore.getState().setAuth(mockUser, MOCK_TOKEN, mockPermissions);
      useAuthStore.getState().updateToken('token-v2');
      useAuthStore.getState().updateToken('token-v3');

      expect(useAuthStore.getState().accessToken).toBe('token-v3');
    });
  });

  // ── updatePermissions ──────────────────────────────────────────────────────

  describe('updatePermissions', () => {
    it('actualizează doar permisiunile', () => {
      useAuthStore.getState().setAuth(mockUser, MOCK_TOKEN, mockPermissions);

      const newPerms: ModulePermission[] = [
        { module: 'clinic', level: 3, isOverridden: false },
      ];
      useAuthStore.getState().updatePermissions(newPerms);

      const state = useAuthStore.getState();
      expect(state.permissions).toEqual(newPerms);
      expect(state.user).toEqual(mockUser);    // neschimbat
      expect(state.accessToken).toBe(MOCK_TOKEN); // neschimbat
    });

    it('poate reseta permisiunile la array gol', () => {
      useAuthStore.getState().setAuth(mockUser, MOCK_TOKEN, mockPermissions);
      useAuthStore.getState().updatePermissions([]);

      expect(useAuthStore.getState().permissions).toEqual([]);
    });
  });

  // ── clearAuth ──────────────────────────────────────────────────────────────

  describe('clearAuth', () => {
    it('resetează toate câmpurile la starea inițială', () => {
      useAuthStore.getState().setAuth(mockUser, MOCK_TOKEN, mockPermissions);
      useAuthStore.getState().clearAuth();

      const state = useAuthStore.getState();
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
      expect(state.permissions).toEqual([]);
      expect(state.isAuthenticated).toBe(false);
    });

    it('este idempotentă — apel repetat nu aruncă erori', () => {
      useAuthStore.getState().clearAuth();
      useAuthStore.getState().clearAuth();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  // ── Proprietăți user ───────────────────────────────────────────────────────

  describe('proprietăți AuthUser', () => {
    it('stochează toate câmpurile user-ului corect', () => {
      useAuthStore.getState().setAuth(mockUser, MOCK_TOKEN, []);

      const user = useAuthStore.getState().user!;
      expect(user.id).toBe(mockUser.id);
      expect(user.email).toBe(mockUser.email);
      expect(user.fullName).toBe(mockUser.fullName);
      expect(user.role).toBe('admin');
      expect(user.roleId).toBe(mockUser.roleId);
      expect(user.clinicId).toBe(mockUser.clinicId);
    });

    it('acceptă toate rolurile valide', () => {
      const roles = ['admin', 'doctor', 'nurse', 'receptionist', 'clinic_manager'] as const;

      for (const role of roles) {
        const user: AuthUser = { ...mockUser, role };
        useAuthStore.getState().setAuth(user, MOCK_TOKEN, []);
        expect(useAuthStore.getState().user?.role).toBe(role);
        resetStore();
      }
    });
  });
});
