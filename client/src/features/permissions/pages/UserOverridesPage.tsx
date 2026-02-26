import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useUsersList, useRoles } from '@/features/users/hooks/useUsers'
import {
  useModulesAndLevels,
  useRolePermissions,
  useUserOverrides,
  useUpdateUserOverrides,
} from '../hooks/usePermissions'
import type { UserOverrideItemPayload, AccessLevelDto } from '../types/permission.types'
import type { UserDto } from '@/features/users/types/user.types'
import styles from './UserOverridesPage.module.scss'

// ── Icoane SVG ────────────────────────────────────────────────────────────────
const IconUserCog = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="4" /><path d="M4 20v-1a8 8 0 0116 0v1" />
    <circle cx="19" cy="19" r="2" strokeWidth="1.5" />
  </svg>
)
const IconSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
)

/// Mapare cod nivel → clasă CSS badge
const levelBadgeClass = (code: string) => {
  switch (code) {
    case 'none':  return styles.levelBadgeNone
    case 'read':  return styles.levelBadgeRead
    case 'write': return styles.levelBadgeWrite
    case 'full':  return styles.levelBadgeFull
    default:      return ''
  }
}

/// Inițiale din nume
const getInitials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()

/// State intern per modul — marchează dacă e override sau se folosește default-ul rolului
interface ModuleEditState {
  isOverridden: boolean
  accessLevelId: string
}

/// Pagina de gestionare override-uri permisiuni per utilizator.
export const UserOverridesPage = () => {
  const [searchParams] = useSearchParams()
  const preselectedUserId = searchParams.get('userId') ?? ''

  // Date auxiliare
  const { data: metaResp, isLoading: loadingMeta } = useModulesAndLevels()
  const { data: usersResp, isLoading: loadingUsers } = useUsersList({
    page: 1,
    pageSize: 500,
    sortBy: 'lastName',
    sortDir: 'asc',
  })

  const modules = metaResp?.data?.modules ?? []
  const accessLevels = metaResp?.data?.accessLevels ?? []
  const users = usersResp?.data?.items ?? []

  // Selectare utilizator
  const [selectedUserId, setSelectedUserId] = useState<string>(preselectedUserId)
  const selectedUser = users.find((u) => u.id === selectedUserId)

  // Permisiuni default ale rolului utilizatorului selectat
  const { data: rolePermResp, isLoading: loadingRolePerm } = useRolePermissions(
    selectedUser?.roleId ?? '',
  )
  const rolePermissions = rolePermResp?.data ?? []

  // Override-uri existente ale utilizatorului
  const { data: overridesResp, isLoading: loadingOverrides } = useUserOverrides(selectedUserId)
  const existingOverrides = overridesResp?.data ?? []

  // State local editare — map moduleId → { isOverridden, accessLevelId }
  const [editMap, setEditMap] = useState<Record<string, ModuleEditState>>({})
  const [isDirty, setIsDirty] = useState(false)

  // Niveluri / module sortate
  const sortedLevels = useMemo(
    () => [...accessLevels].sort((a, b) => a.level - b.level),
    [accessLevels],
  )
  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.sortOrder - b.sortOrder),
    [modules],
  )

  // Sync editMap când se schimbă utilizatorul sau datele
  useEffect(() => {
    if (!selectedUserId || sortedModules.length === 0) return

    const overrideMap = new Map(existingOverrides.map((o) => [o.moduleId, o.accessLevelId]))
    const roleMap = new Map(rolePermissions.map((r) => [r.moduleId, r.accessLevelId]))

    const map: Record<string, ModuleEditState> = {}
    for (const mod of sortedModules) {
      const hasOverride = overrideMap.has(mod.id)
      map[mod.id] = {
        isOverridden: hasOverride,
        accessLevelId: hasOverride
          ? overrideMap.get(mod.id)!
          : roleMap.get(mod.id) ?? sortedLevels[0]?.id ?? '',
      }
    }
    setEditMap(map)
    setIsDirty(false)
  }, [selectedUserId, existingOverrides, rolePermissions, sortedModules, sortedLevels])

  // Handlers
  const handleToggleOverride = useCallback(
    (moduleId: string) => {
      setEditMap((prev) => {
        const current = prev[moduleId]
        if (!current) return prev
        // Când dezactivezi override → revert la nivelul default al rolului
        const roleLevel = rolePermissions.find((r) => r.moduleId === moduleId)
        return {
          ...prev,
          [moduleId]: {
            isOverridden: !current.isOverridden,
            accessLevelId: !current.isOverridden
              ? current.accessLevelId
              : roleLevel?.accessLevelId ?? current.accessLevelId,
          },
        }
      })
      setIsDirty(true)
    },
    [rolePermissions],
  )

  const handleLevelChange = useCallback((moduleId: string, accessLevelId: string) => {
    setEditMap((prev) => ({
      ...prev,
      [moduleId]: { ...prev[moduleId], isOverridden: true, accessLevelId },
    }))
    setIsDirty(true)
  }, [])

  // Salvare — trimite doar modulele cu override activ
  const updateMutation = useUpdateUserOverrides()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSave = async () => {
    setSuccessMsg(null)
    setErrorMsg(null)

    const overrides: UserOverrideItemPayload[] = Object.entries(editMap)
      .filter(([, state]) => state.isOverridden)
      .map(([moduleId, state]) => ({ moduleId, accessLevelId: state.accessLevelId }))

    try {
      await updateMutation.mutateAsync({ userId: selectedUserId, overrides })
      setSuccessMsg('Override-urile au fost salvate cu succes.')
      setIsDirty(false)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Eroare la salvare.')
    }
  }

  // Helpers UI
  const getLevelById = (id: string): AccessLevelDto | undefined =>
    sortedLevels.find((l) => l.id === id)

  const getRoleDefault = (moduleId: string) =>
    rolePermissions.find((r) => r.moduleId === moduleId)

  const isLoading = loadingMeta || loadingUsers || loadingRolePerm || loadingOverrides

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>
            <IconUserCog /> Override Permisiuni Utilizator
          </h1>
          <p className={styles.pageSubtitle}>
            Configurează excepții de la permisiunile standard ale rolului
          </p>
        </div>
      </div>

      {/* Conținut */}
      <div className={styles.content}>
        {/* Selector utilizator */}
        <div className={styles.userSelector}>
          <span className={styles.userLabel}>Utilizator:</span>
          <select
            className={`form-select form-select-sm ${styles.userSelect}`}
            value={selectedUserId}
            onChange={(e) => {
              setSelectedUserId(e.target.value)
              setSuccessMsg(null)
              setErrorMsg(null)
            }}
          >
            <option value="">— Selectează utilizator —</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.lastName} {u.firstName} ({u.roleName}) — {u.email}
              </option>
            ))}
          </select>
        </div>

        {/* Info card utilizator */}
        {selectedUser && (
          <div className={styles.userInfo}>
            <div className={styles.userInfoAvatar}>
              {getInitials(selectedUser.firstName, selectedUser.lastName)}
            </div>
            <div className={styles.userInfoDetails}>
              <div className={styles.userInfoName}>
                {selectedUser.lastName} {selectedUser.firstName}
              </div>
              <div className={styles.userInfoMeta}>
                {selectedUser.roleName} &middot; {selectedUser.email}
              </div>
            </div>
          </div>
        )}

        {!selectedUserId && (
          <div className={styles.empty}>
            Selectează un utilizator pentru a vedea și edita override-urile.
          </div>
        )}

        {isLoading && selectedUserId && (
          <div className={styles.loading}>
            <div className="spinner-border spinner-border-sm text-primary me-2" role="status" />
            Se încarcă...
          </div>
        )}

        {!isLoading && selectedUserId && sortedModules.length > 0 && (
          <>
            {/* Matrice permisiuni */}
            <table className={styles.matrix}>
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Modul</th>
                  <th style={{ width: '15%' }}>Default Rol</th>
                  <th style={{ width: '15%' }}>Override?</th>
                  <th style={{ width: '25%' }}>Nivel acces</th>
                  <th style={{ width: '20%' }}>Efectiv</th>
                </tr>
              </thead>
              <tbody>
                {sortedModules.map((mod) => {
                  const state = editMap[mod.id]
                  if (!state) return null

                  const roleDefault = getRoleDefault(mod.id)
                  const roleLevel = roleDefault
                    ? getLevelById(roleDefault.accessLevelId)
                    : undefined

                  const effectiveLevel = getLevelById(state.accessLevelId)

                  return (
                    <tr key={mod.id}>
                      {/* Modul */}
                      <td>
                        <div className={styles.moduleCell}>
                          <span className={styles.moduleName}>{mod.name}</span>
                          <span className={styles.moduleCode}>{mod.code}</span>
                        </div>
                      </td>

                      {/* Default rol */}
                      <td>
                        {roleLevel && (
                          <span className={`${styles.levelBadge} ${levelBadgeClass(roleLevel.code)}`}>
                            {roleLevel.name}
                          </span>
                        )}
                      </td>

                      {/* Toggle override */}
                      <td>
                        <label className={styles.overrideToggle}>
                          <input
                            type="checkbox"
                            className={styles.overrideCheckbox}
                            checked={state.isOverridden}
                            onChange={() => handleToggleOverride(mod.id)}
                          />
                          <span className={styles.overrideToggleLabel}>
                            {state.isOverridden ? 'Da' : 'Nu'}
                          </span>
                        </label>
                      </td>

                      {/* Selector nivel */}
                      <td>
                        <select
                          className={`form-select form-select-sm ${styles.levelSelect}`}
                          value={state.accessLevelId}
                          onChange={(e) => handleLevelChange(mod.id, e.target.value)}
                          disabled={!state.isOverridden}
                        >
                          {sortedLevels.map((lvl) => (
                            <option key={lvl.id} value={lvl.id}>
                              {lvl.name} ({lvl.level})
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Nivel efectiv */}
                      <td>
                        {effectiveLevel && (
                          <span className={`${styles.levelBadge} ${levelBadgeClass(effectiveLevel.code)}`}>
                            {effectiveLevel.name}
                          </span>
                        )}
                        {state.isOverridden ? (
                          <span className={styles.overrideIndicator}> ↑ override</span>
                        ) : (
                          <span className={styles.defaultIndicator}> (rol)</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {/* Acțiuni */}
            <div className={styles.actions}>
              <button
                className="btn btn-primary btn-sm d-flex align-items-center gap-1"
                onClick={handleSave}
                disabled={!isDirty || updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <span className="spinner-border spinner-border-sm" />
                ) : (
                  <IconSave />
                )}
                Salvează override-uri
              </button>
            </div>
          </>
        )}

        {/* Feedback */}
        {successMsg && (
          <div className={`alert alert-success mt-3 ${styles.feedback}`}>{successMsg}</div>
        )}
        {errorMsg && (
          <div className={`alert alert-danger mt-3 ${styles.feedback}`}>{errorMsg}</div>
        )}
      </div>
    </div>
  )
}

export default UserOverridesPage
