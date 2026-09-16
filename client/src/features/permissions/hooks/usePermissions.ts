import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/store/authStore'
import { permissionsApi } from '@/api/endpoints/permissions.api'
import type {
  RolePermissionItemPayload,
  UserOverrideItemPayload,
  UserEffectivePermissionDto,
} from '../types/permission.types'
import type { ModulePermission } from '@/features/auth/types/auth.types'

/// Reîmprospătează permisiunile din authStore dacă utilizatorul afectat este cel curent.
/// Se apelează după modificarea permisiunilor de rol sau a override-urilor, astfel încât
/// sidebar-ul și garda de rută să reflecte schimbarea fără a aștepta re-login.
async function refreshCurrentUserPermissionsIfAffected(
  affectedUserId?: string,
  affectedRoleId?: string,
) {
  const currentUser = useAuthStore.getState().user
  if (!currentUser) return

  const isAffected =
    (affectedUserId !== undefined && affectedUserId === currentUser.id) ||
    (affectedRoleId !== undefined && affectedRoleId === currentUser.roleId)
  if (!isAffected) return

  const response = await permissionsApi.getUserEffective(currentUser.id, currentUser.roleId)
  const effective = (response.data ?? []) as UserEffectivePermissionDto[]
  const permissions: ModulePermission[] = effective.map((p) => ({
    module: p.moduleCode,
    level: p.accessLevel,
    isOverridden: p.isOverridden,
  }))

  useAuthStore.getState().updatePermissions(permissions)
}

// ── Query keys ────────────────────────────────────────────────────────────────
export const permissionKeys = {
  all: ['permissions'] as const,
  modulesAndLevels: () => [...permissionKeys.all, 'modules-and-levels'] as const,
  rolePermissions: (roleId: string) => [...permissionKeys.all, 'role', roleId] as const,
  userOverrides: (userId: string) => [...permissionKeys.all, 'user-overrides', userId] as const,
  userEffective: (userId: string) => [...permissionKeys.all, 'user-effective', userId] as const,
}

// ── Queries ───────────────────────────────────────────────────────────────────

/// Module + niveluri de acces — pentru dropdowns în UI.
export const useModulesAndLevels = () =>
  useQuery({
    queryKey: permissionKeys.modulesAndLevels(),
    queryFn: () => permissionsApi.getModulesAndLevels(),
    staleTime: Infinity, // definiții de sistem — nu se schimbă
  })

/// Permisiuni default per rol.
export const useRolePermissions = (roleId: string) =>
  useQuery({
    queryKey: permissionKeys.rolePermissions(roleId),
    queryFn: () => permissionsApi.getRolePermissions(roleId),
    enabled: !!roleId,
  })

/// Override-uri permisiuni per utilizator.
export const useUserOverrides = (userId: string) =>
  useQuery({
    queryKey: permissionKeys.userOverrides(userId),
    queryFn: () => permissionsApi.getUserOverrides(userId),
    enabled: !!userId,
  })

/// Permisiuni efective per utilizator (rol + override-uri).
export const useUserEffective = (userId: string, roleId: string) =>
  useQuery({
    queryKey: permissionKeys.userEffective(userId),
    queryFn: () => permissionsApi.getUserEffective(userId, roleId),
    enabled: !!userId && !!roleId,
  })

// ── Mutations ─────────────────────────────────────────────────────────────────

/// Salvează permisiunile default ale unui rol.
export const useUpdateRolePermissions = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ roleId, permissions }: { roleId: string; permissions: RolePermissionItemPayload[] }) =>
      permissionsApi.updateRolePermissions(roleId, permissions),
    onSuccess: async (_, { roleId }) => {
      await queryClient.invalidateQueries({ queryKey: permissionKeys.rolePermissions(roleId) })
      await refreshCurrentUserPermissionsIfAffected(undefined, roleId)
    },
  })
}

/// Salvează override-urile de permisiuni ale unui utilizator.
export const useUpdateUserOverrides = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, overrides }: { userId: string; overrides: UserOverrideItemPayload[] }) =>
      permissionsApi.updateUserOverrides(userId, overrides),
    onSuccess: async (_, { userId }) => {
      await queryClient.invalidateQueries({ queryKey: permissionKeys.userOverrides(userId) })
      await queryClient.invalidateQueries({ queryKey: permissionKeys.userEffective(userId) })
      await refreshCurrentUserPermissionsIfAffected(userId, undefined)
    },
  })
}
