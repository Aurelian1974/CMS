import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { permissionsApi } from '@/api/endpoints/permissions.api'
import type { RolePermissionItemPayload, UserOverrideItemPayload } from '../types/permission.types'

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
    staleTime: 30 * 60 * 1000, // 30 min — se schimbă rar
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
    onSuccess: (_, { roleId }) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.rolePermissions(roleId) })
    },
  })
}

/// Salvează override-urile de permisiuni ale unui utilizator.
export const useUpdateUserOverrides = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, overrides }: { userId: string; overrides: UserOverrideItemPayload[] }) =>
      permissionsApi.updateUserOverrides(userId, overrides),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: permissionKeys.userOverrides(userId) })
      queryClient.invalidateQueries({ queryKey: permissionKeys.userEffective(userId) })
    },
  })
}
