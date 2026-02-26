/// Tipuri TypeScript pentru modulul de permisiuni RBAC

/// Modul disponibil în sistem
export interface ModuleDto {
  id: string
  code: string
  name: string
  description: string | null
  sortOrder: number
  isActive: boolean
}

/// Nivel de acces disponibil
export interface AccessLevelDto {
  id: string
  code: string
  name: string
  level: number
}

/// Răspuns interogare module + niveluri (pentru dropdowns)
export interface ModulesAndLevelsDto {
  modules: ModuleDto[]
  accessLevels: AccessLevelDto[]
}

/// Permisiune default pe rol (per modul)
export interface RoleModulePermissionDto {
  moduleId: string
  moduleCode: string
  moduleName: string
  sortOrder: number
  accessLevelId: string
  accessLevelCode: string
  accessLevel: number
}

/// Override permisiune pe utilizator
export interface UserOverrideDto {
  moduleId: string
  moduleCode: string
  moduleName: string
  sortOrder: number
  accessLevelId: string
  accessLevelCode: string
  accessLevel: number
  reason: string | null
  grantedBy: string
  grantedAt: string
  grantedByName: string
}

/// Permisiune efectivă utilizator (rol + override)
export interface UserEffectivePermissionDto {
  moduleId: string
  moduleCode: string
  moduleName: string
  sortOrder: number
  accessLevelId: string
  accessLevelCode: string
  accessLevel: number
  isOverridden: boolean
}

/// Payload pentru actualizare permisiuni rol
export interface RolePermissionItemPayload {
  moduleId: string
  accessLevelId: string
}

/// Payload pentru actualizare override-uri utilizator
export interface UserOverrideItemPayload {
  moduleId: string
  accessLevelId: string
}
