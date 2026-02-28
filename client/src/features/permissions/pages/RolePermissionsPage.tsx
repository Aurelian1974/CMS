import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRoles } from '@/features/users/hooks/useUsers'
import { AppButton } from '@/components/ui/AppButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  useModulesAndLevels,
  useRolePermissions,
  useUpdateRolePermissions,
} from '../hooks/usePermissions'
import type {
  RoleModulePermissionDto,
  RolePermissionItemPayload,
  AccessLevelDto,
} from '../types/permission.types'
import styles from './RolePermissionsPage.module.scss'

// ── Icoane SVG ────────────────────────────────────────────────────────────────
const IconShield = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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

/// Pagina de administrare permisiuni pe rol — matrice module × niveluri de acces.
export const RolePermissionsPage = () => {
  const { data: rolesResp, isLoading: loadingRoles } = useRoles()
  const { data: metaResp, isLoading: loadingMeta } = useModulesAndLevels()

  const roles = rolesResp?.data ?? []
  const modules = metaResp?.data?.modules ?? []
  const accessLevels = metaResp?.data?.accessLevels ?? []

  // Selectare rol activ — default primul din listă
  const [selectedRoleId, setSelectedRoleId] = useState<string>('')

  useEffect(() => {
    if (!selectedRoleId && roles.length > 0) {
      setSelectedRoleId(roles[0].id)
    }
  }, [roles, selectedRoleId])

  // Permisiuni curente ale rolului selectat
  const { data: permResp, isLoading: loadingPerms } = useRolePermissions(selectedRoleId)
  const currentPermissions = permResp?.data ?? []

  // State local pentru editare — map moduleId → accessLevelId
  const [editMap, setEditMap] = useState<Record<string, string>>({})
  const [isDirty, setIsDirty] = useState(false)

  // Sync editMap când se schimbă rolul sau se încarcă permisiunile
  useEffect(() => {
    if (currentPermissions.length > 0) {
      const map: Record<string, string> = {}
      for (const p of currentPermissions) {
        map[p.moduleId] = p.accessLevelId
      }
      setEditMap(map)
      setIsDirty(false)
    }
  }, [currentPermissions])

  // Niveluri sortate
  const sortedLevels = useMemo(
    () => [...accessLevels].sort((a, b) => a.level - b.level),
    [accessLevels],
  )

  // Sortează modulele
  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.sortOrder - b.sortOrder),
    [modules],
  )

  // Handler schimbare nivel
  const handleLevelChange = useCallback((moduleId: string, accessLevelId: string) => {
    setEditMap((prev) => ({ ...prev, [moduleId]: accessLevelId }))
    setIsDirty(true)
  }, [])

  // Salvare
  const updateMutation = useUpdateRolePermissions()

  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleSave = async () => {
    setSuccessMsg(null)
    setErrorMsg(null)

    const permissions: RolePermissionItemPayload[] = Object.entries(editMap).map(
      ([moduleId, accessLevelId]) => ({ moduleId, accessLevelId }),
    )

    try {
      await updateMutation.mutateAsync({ roleId: selectedRoleId, permissions })
      setSuccessMsg('Permisiunile au fost salvate cu succes.')
      setIsDirty(false)
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Eroare la salvare.')
    }
  }

  // Rezolvă numele nivelului curent (pentru preview badge)
  const getLevelForModule = (moduleId: string): AccessLevelDto | undefined => {
    const id = editMap[moduleId]
    return sortedLevels.find((l) => l.id === id)
  }

  const isLoading = loadingRoles || loadingMeta || loadingPerms
  const selectedRole = roles.find((r) => r.id === selectedRoleId)

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>
            <IconShield /> Permisiuni Roluri
          </h1>
          <p className={styles.pageSubtitle}>
            Configurează nivelurile de acces implicite pentru fiecare rol
          </p>
        </div>
      </div>

      {/* Conținut */}
      <div className={styles.content}>
        {/* Tabs roluri */}
        <div className={styles.roleTabs}>
          {roles.map((role) => (
            <button
              key={role.id}
              className={`${styles.roleTab}${role.id === selectedRoleId ? ` ${styles.roleTabActive}` : ''}`}
              onClick={() => { setSelectedRoleId(role.id); setSuccessMsg(null); setErrorMsg(null) }}
            >
              {role.name}
            </button>
          ))}
        </div>

        {isLoading && (
          <div className={styles.loading}>
            <LoadingSpinner size="sm" />
            Se încarcă...
          </div>
        )}

        {!isLoading && selectedRoleId && sortedModules.length > 0 && (
          <>
            {/* Matrice permisiuni */}
            <table className={styles.matrix}>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Modul</th>
                  <th style={{ width: '30%' }}>Nivel acces</th>
                  <th style={{ width: '30%' }}>Preview</th>
                </tr>
              </thead>
              <tbody>
                {sortedModules.map((mod) => {
                  const currentLevel = getLevelForModule(mod.id)
                  return (
                    <tr key={mod.id}>
                      <td>
                        <div className={styles.moduleCell}>
                          <span className={styles.moduleName}>{mod.name}</span>
                          <span className={styles.moduleCode}>{mod.code}</span>
                        </div>
                      </td>
                      <td>
                        <select
                          className={`form-select form-select-sm ${styles.levelSelect}`}
                          value={editMap[mod.id] ?? ''}
                          onChange={(e) => handleLevelChange(mod.id, e.target.value)}
                        >
                          {sortedLevels.map((lvl) => (
                            <option key={lvl.id} value={lvl.id}>
                              {lvl.name} ({lvl.level})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        {currentLevel && (
                          <span className={`${styles.levelBadge} ${levelBadgeClass(currentLevel.code)}`}>
                            {currentLevel.name}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            <div className={styles.actions}>
              <AppButton
                variant="primary"
                size="sm"
                onClick={handleSave}
                disabled={!isDirty}
                isLoading={updateMutation.isPending}
                loadingText={`Salvează permisiuni ${selectedRole?.name ?? ''}`}
              >
                <IconSave />
                Salvează permisiuni {selectedRole?.name ?? ''}
              </AppButton>
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

export default RolePermissionsPage
