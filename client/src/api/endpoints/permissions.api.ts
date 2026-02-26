import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  ModulesAndLevelsDto,
  RoleModulePermissionDto,
  UserOverrideDto,
  UserEffectivePermissionDto,
  RolePermissionItemPayload,
  UserOverrideItemPayload,
} from '@/features/permissions/types/permission.types'

export const permissionsApi = {
  /// Returnează modulele și nivelurile de acces disponibile.
  getModulesAndLevels: (): Promise<ApiResponse<ModulesAndLevelsDto>> =>
    api.get('/api/permissions/modules-and-levels'),

  /// Returnează permisiunile default ale unui rol.
  getRolePermissions: (roleId: string): Promise<ApiResponse<RoleModulePermissionDto[]>> =>
    api.get(`/api/permissions/roles/${roleId}`),

  /// Actualizează permisiunile default ale unui rol (replace all).
  updateRolePermissions: (
    roleId: string,
    permissions: RolePermissionItemPayload[],
  ): Promise<ApiResponse<number>> =>
    api.put(`/api/permissions/roles/${roleId}`, { permissions }),

  /// Returnează override-urile de permisiuni ale unui utilizator.
  getUserOverrides: (userId: string): Promise<ApiResponse<UserOverrideDto[]>> =>
    api.get(`/api/permissions/users/${userId}/overrides`),

  /// Returnează permisiunile efective ale unui utilizator (rol + override-uri).
  getUserEffective: (
    userId: string,
    roleId: string,
  ): Promise<ApiResponse<UserEffectivePermissionDto[]>> =>
    api.get(`/api/permissions/users/${userId}/effective`, { params: { roleId } }),

  /// Actualizează override-urile de permisiuni ale unui utilizator (replace all).
  updateUserOverrides: (
    userId: string,
    overrides: UserOverrideItemPayload[],
  ): Promise<ApiResponse<number>> =>
    api.put(`/api/permissions/users/${userId}/overrides`, { overrides }),
}
