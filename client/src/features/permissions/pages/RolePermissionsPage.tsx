import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DropDownListComponent } from '@syncfusion/ej2-react-dropdowns'
import { useRoles } from '@/features/users/hooks/useUsers'
import { PageHeader } from '@/components/layout/PageHeader'
import { AppButton } from '@/components/ui/AppButton'
import { AppModal } from '@/components/ui/AppModal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { FeedbackAlerts } from '@/components/ui/FeedbackAlerts'
import { AppDataGrid } from '@/components/data-display/AppDataGrid'
import type { ColDef } from '@/components/data-display/AppDataGrid'
import { useFeedback } from '@/hooks/useFeedback'
import { useHasAccess, MODULE, ACCESS_LEVEL } from '@/hooks/useHasAccess'
import {
  useModulesAndLevels,
  useRolePermissions,
  useUpdateRolePermissions,
} from '../hooks/usePermissions'
import type {
  RolePermissionItemPayload,
  AccessLevelDto,
} from '../types/permission.types'
import styles from './RolePermissionsPage.module.scss'

// ── Icoane ───────────────────────────────────────────────────────────────────
const IconSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
)

const IconSearch = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
)

const IconRotateCcw = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 102.13-9.36L1 10" />
  </svg>
)

// ── Helpers ──────────────────────────────────────────────────────────────────

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

/// Rând afișat în grid
interface PermissionRow {
  moduleId: string
  moduleCode: string
  moduleName: string
  sortOrder: number
  accessLevelId: string
  previewLevelId: string
  originalAccessLevelId: string
  isDirty: boolean
}

/// Celulă dropdown pentru selectorul de nivel — componentă separată pentru ref propriu.
interface LevelDropdownCellProps {
  value: string
  options: { label: string; value: string }[]
  enabled: boolean
  onChange: (value: string) => void
}
const LevelDropdownCell = ({ value, options, enabled, onChange }: LevelDropdownCellProps) => {
  const ref = useRef<DropDownListComponent | null>(null)
  return (
    <DropDownListComponent
      ref={ref}
      dataSource={options as never}
      fields={{ text: 'label', value: 'value' }}
      value={value}
      change={(args) => {
        if (args.value) onChange(args.value as string)
      }}
      enabled={enabled}
      popupHeight="220px"
      cssClass={styles.gridDropdown}
    />
  )
}

/// Pagina de administrare permisiuni pe rol — matrice module × niveluri de acces.
export const RolePermissionsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const { hasAccess } = useHasAccess()
  const canEditPermissions = hasAccess(MODULE.Users, ACCESS_LEVEL.Full)

  const { data: rolesResp, isLoading: loadingRoles, isError: rolesError } = useRoles()
  const { data: metaResp, isLoading: loadingMeta, isError: metaError } = useModulesAndLevels()

  const roles = useMemo(() => rolesResp?.data ?? [], [rolesResp])
  const modules = useMemo(() => metaResp?.data?.modules ?? [], [metaResp])
  const accessLevels = useMemo(() => metaResp?.data?.accessLevels ?? [], [metaResp])

  // Selectare rol activ — default primul din listă sau din URL
  const [selectedRoleId, setSelectedRoleId] = useState<string>(() => searchParams.get('role') ?? '')
  const [pendingRoleId, setPendingRoleId] = useState<string | null>(null)

  useEffect(() => {
    const roleFromUrl = searchParams.get('role') ?? ''
    if (roles.length > 0 && !roles.some(r => r.id === roleFromUrl)) {
      setSelectedRoleId(roles[0].id)
      setSearchParams({ role: roles[0].id }, { replace: true })
    }
  }, [roles, searchParams, setSearchParams])

  // Permisiuni curente ale rolului selectat
  const {
    data: permResp,
    isLoading: loadingPerms,
    isError: permsError,
  } = useRolePermissions(selectedRoleId)
  const currentPermissions = useMemo(() => permResp?.data ?? [], [permResp])

  // State local pentru editare
  const [editMap, setEditMap] = useState<Record<string, string>>({})
  const [originalMap, setOriginalMap] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')

  const { successMsg, errorMsg, showSuccess, showError, setSuccessMsg, setErrorMsg, clearMessages } = useFeedback()

  // Sync editMap/originalMap când se schimbă rolul sau se încarcă permisiunile
  useEffect(() => {
    if (selectedRoleId && currentPermissions.length >= 0) {
      const map: Record<string, string> = {}
      for (const p of currentPermissions) {
        map[p.moduleId] = p.accessLevelId
      }
      setEditMap(map)
      setOriginalMap(map)
      clearMessages()
    }
  }, [currentPermissions, selectedRoleId, clearMessages])

  // Niveluri sortate (crescător după level)
  const sortedLevels = useMemo(
    () => [...accessLevels].sort((a, b) => a.level - b.level),
    [accessLevels],
  )

  const levelById = useMemo(() => {
    const map = new Map<string, AccessLevelDto>()
    for (const lvl of accessLevels) map.set(lvl.id, lvl)
    return map
  }, [accessLevels])

  // Module sortate și filtrate
  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.sortOrder - b.sortOrder),
    [modules],
  )

  const filteredModules = useMemo(() => {
    if (!search.trim()) return sortedModules
    const q = search.toLowerCase()
    return sortedModules.filter(
      m => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q),
    )
  }, [sortedModules, search])

  // Rânduri pentru grid
  const rowData = useMemo<PermissionRow[]>(() => {
    return filteredModules.map(m => {
      const accessLevelId = editMap[m.id] ?? sortedLevels[0]?.id ?? ''
      return {
        moduleId: m.id,
        moduleCode: m.code,
        moduleName: m.name,
        sortOrder: m.sortOrder,
        accessLevelId,
        previewLevelId: accessLevelId,
        originalAccessLevelId: originalMap[m.id] ?? sortedLevels[0]?.id ?? '',
        isDirty: (editMap[m.id] ?? '') !== (originalMap[m.id] ?? ''),
      }
    })
  }, [filteredModules, editMap, originalMap, sortedLevels])

  const isDirty = useMemo(
    () => rowData.some(r => r.isDirty),
    [rowData],
  )

  // Handler schimbare nivel
  const handleLevelChange = useCallback((moduleId: string, accessLevelId: string) => {
    setEditMap(prev => ({ ...prev, [moduleId]: accessLevelId }))
  }, [])

  // Acțiuni bulk
  const handleSetAll = useCallback((accessLevelId: string) => {
    setEditMap(prev => {
      const next = { ...prev }
      for (const m of sortedModules) {
        next[m.id] = accessLevelId
      }
      return next
    })
  }, [sortedModules])

  const handleReset = useCallback(() => {
    setEditMap(originalMap)
  }, [originalMap])

  // Schimbare rol cu confirmare modificări nesalvate
  const handleRoleTabClick = useCallback((roleId: string) => {
    if (isDirty && roleId !== selectedRoleId) {
      setPendingRoleId(roleId)
      return
    }
    setSelectedRoleId(roleId)
    setSearchParams({ role: roleId }, { replace: true })
    clearMessages()
  }, [isDirty, selectedRoleId, setSearchParams, clearMessages])

  const confirmRoleChange = useCallback(() => {
    if (pendingRoleId) {
      setSelectedRoleId(pendingRoleId)
      setSearchParams({ role: pendingRoleId }, { replace: true })
      setPendingRoleId(null)
      clearMessages()
    }
  }, [pendingRoleId, setSearchParams, clearMessages])

  // Salvare
  const updateMutation = useUpdateRolePermissions()

  const handleSave = useCallback(async () => {
    if (!selectedRoleId) return
    const permissions: RolePermissionItemPayload[] = Object.entries(editMap).map(
      ([moduleId, accessLevelId]) => ({ moduleId, accessLevelId }),
    )

    try {
      await updateMutation.mutateAsync({ roleId: selectedRoleId, permissions })
      setOriginalMap(editMap)
      showSuccess('Permisiunile au fost salvate cu succes.')
    } catch (err: unknown) {
      showError(err)
    }
  }, [selectedRoleId, editMap, updateMutation, showSuccess, showError])

  // Avertisment înainte de închidere/reîncărcare cu modificări nesalvate
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const selectedRole = useMemo(() => roles.find(r => r.id === selectedRoleId), [roles, selectedRoleId])

  // ── Cell renderers pentru grid ─────────────────────────────────────────────
  const moduleCellRenderer = useCallback(({ data }: { data: PermissionRow }) => (
    <div className={styles.moduleCell}>
      <span className={styles.moduleName}>{data.moduleName}</span>
      <span className={styles.moduleCode}>{data.moduleCode}</span>
    </div>
  ), [])

  const levelCellRenderer = useCallback(({ data }: { data: PermissionRow }) => {
    const options = sortedLevels.map(l => ({ label: `${l.name} (${l.level})`, value: l.id }))
    return (
      <LevelDropdownCell
        value={data.accessLevelId}
        options={options}
        enabled={canEditPermissions}
        onChange={(value) => handleLevelChange(data.moduleId, value)}
      />
    )
  }, [sortedLevels, canEditPermissions, handleLevelChange])

  const previewCellRenderer = useCallback(({ data }: { data: PermissionRow }) => {
    const level = levelById.get(data.previewLevelId)
    if (!level) return null
    return (
      <span className={`${styles.levelBadge} ${levelBadgeClass(level.code)}`}>
        {level.name}
      </span>
    )
  }, [levelById])

  const columnDefs = useMemo<ColDef<PermissionRow>[]>(() => [
    {
      field: 'moduleName',
      headerName: 'Modul',
      flex: 2,
      minWidth: 220,
      sortable: true,
      cellRenderer: moduleCellRenderer,
      cellClass: styles.moduleColumn,
    },
    {
      colId: 'accessLevelSelect',
      field: 'accessLevelId',
      headerName: 'Nivel acces',
      flex: 1,
      minWidth: 200,
      sortable: true,
      cellRenderer: levelCellRenderer,
    },
    {
      colId: 'accessLevelPreview',
      field: 'previewLevelId',
      headerName: 'Preview',
      flex: 1,
      minWidth: 140,
      sortable: false,
      cellRenderer: previewCellRenderer,
    },
  ], [moduleCellRenderer, levelCellRenderer, previewCellRenderer])

  const isLoading = loadingRoles || loadingMeta || loadingPerms
  const isError = rolesError || metaError || permsError

  if (isError) {
    return (
      <div className={styles.page}>
        <div className="alert alert-danger m-4">
          Nu s-au putut încărca datele. Verificați conexiunea la server.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Permisiuni Roluri"
        subtitle="Configurează nivelurile de acces implicite pentru fiecare rol"
        actions={
          <AppButton
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || !canEditPermissions}
            isLoading={updateMutation.isPending}
            loadingText="Se salvează..."
            leftIcon={<IconSave />}
          >
            Salvează permisiuni {selectedRole?.name ?? ''}
          </AppButton>
        }
      />

      <div className={styles.content}>
        {/* Tabs roluri */}
        <div className={styles.roleTabs}>
          {roles.map(role => (
            <button
              key={role.id}
              className={`${styles.roleTab}${role.id === selectedRoleId ? ` ${styles.roleTabActive}` : ''}`}
              onClick={() => handleRoleTabClick(role.id)}
            >
              {role.name}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div className={styles.searchWrap}>
            <span className={styles.searchIcon}><IconSearch /></span>
            <input
              type="text"
              className={styles.searchInput}
              placeholder="Caută modul după denumire sau cod..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          <div className={styles.bulkActions}>
            {sortedLevels.map(level => (
              <AppButton
                key={level.id}
                variant="outline-secondary"
                size="sm"
                onClick={() => handleSetAll(level.id)}
                disabled={!canEditPermissions}
                title={`Setează toate modulele la ${level.name}`}
              >
                {level.name}
              </AppButton>
            ))}
            <AppButton
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={!isDirty}
              leftIcon={<IconRotateCcw />}
            >
              Reset
            </AppButton>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>
            <LoadingSpinner size="sm" />
            Se încarcă...
          </div>
        ) : (
          <div className={styles.gridWrapper}>
            <AppDataGrid<PermissionRow>
              rowData={rowData}
              columnDefs={columnDefs}
              getRowId={row => row.moduleId}
              pagination={false}
              loading={isLoading}
              height={520}
              alternateRows
              enableHover
              gridLines="horizontal"
              stickyHeader
              initialSort={[{ field: 'sortOrder', direction: 'asc' }]}
            />
          </div>
        )}

        <FeedbackAlerts
          successMsg={successMsg}
          errorMsg={errorMsg}
          onDismissSuccess={() => setSuccessMsg(null)}
          onDismissError={() => setErrorMsg(null)}
        />
      </div>

      {/* Confirmare schimbare rol cu modificări nesalvate */}
      <AppModal
        isOpen={!!pendingRoleId}
        onClose={() => setPendingRoleId(null)}
        title="Modificări nesalvate"
        footer={
          <div className={styles.modalActions}>
            <AppButton variant="outline-secondary" onClick={() => setPendingRoleId(null)}>
              Rămâi pe pagină
            </AppButton>
            <AppButton variant="primary" onClick={confirmRoleChange}>
              Renunță și schimbă rolul
            </AppButton>
          </div>
        }
      >
        <p>Ai modificări nesalvate pentru rolul <strong>{selectedRole?.name ?? ''}</strong>.</p>
        <p>Dacă continui, modificările vor fi pierdute.</p>
      </AppModal>
    </div>
  )
}
