import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { useUsersList } from '@/features/users/hooks/useUsers'
import { AppButton } from '@/components/ui/AppButton'
import { AppModal } from '@/components/ui/AppModal'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  useModulesAndLevels,
  useRolePermissions,
  useUserOverrides,
  useUpdateUserOverrides,
} from '../hooks/usePermissions'
import type { UserOverrideItemPayload, AccessLevelDto, ModuleDto } from '../types/permission.types'
import styles from './UserOverridesPage.module.scss'

const IconSave = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
  </svg>
)

const IconScreen = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)

const IconComponent = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
)

const IconAction = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v4" /><path d="M12 18v4" />
    <path d="M4.93 4.93l2.83 2.83" /><path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" /><path d="M18 12h4" />
    <path d="M4.93 19.07l2.83-2.83" /><path d="M16.24 7.76l2.83-2.83" />
  </svg>
)

const IconModal = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="9" y1="15" x2="15" y2="15" />
  </svg>
)

const IconModalsGroup = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="6" y="3" width="15" height="15" rx="2" />
    <rect x="3" y="6" width="15" height="15" rx="2" />
  </svg>
)

const levelBadgeClass = (code: string) => {
  switch (code) {
    case 'none': return styles.levelBadgeNone
    case 'read': return styles.levelBadgeRead
    case 'write': return styles.levelBadgeWrite
    case 'full': return styles.levelBadgeFull
    default: return ''
  }
}

const getInitials = (first: string, last: string) =>
  `${first.charAt(0)}${last.charAt(0)}`.toUpperCase()

interface ModuleEditState {
  isOverridden: boolean
  accessLevelId: string
}

type ObjectKind = 'screen' | 'component' | 'action' | 'modal' | 'modal-group'

interface ModuleObjectConfig {
  id: string
  name: string
  description: string
  kind: ObjectKind
  children?: ModuleObjectConfig[]
}

const kindIcon = (kind: ObjectKind) => {
  switch (kind) {
    case 'screen': return <IconScreen />
    case 'component': return <IconComponent />
    case 'action': return <IconAction />
    case 'modal': return <IconModal />
    case 'modal-group': return <IconModalsGroup />
    default: return <IconScreen />
  }
}

const kindLabel = (kind: ObjectKind) => {
  switch (kind) {
    case 'screen': return 'Ecran'
    case 'component': return 'Componentă'
    case 'action': return 'Acțiune'
    case 'modal': return 'Modal'
    case 'modal-group': return 'Grup modale'
    default: return 'Obiect'
  }
}

const moduleObjectCatalog: Record<string, ModuleObjectConfig[]> = {
  patients: [
    { id: 'patient-list', name: 'Lista pacienți', description: 'Pagina principală cu tabelul de pacienți', kind: 'screen' },
    { id: 'patient-filters', name: 'Filtre listă pacienți', description: 'Căutare, gen, grupă sânge, alergii, status', kind: 'component' },
    { id: 'patient-toolbar', name: 'Toolbar listă pacienți', description: 'Export Excel, CSV, PDF, print, coloane', kind: 'component' },
    { id: 'patient-row-actions', name: 'Acțiuni rând pacienți', description: 'Vizualizare, editare, ștergere pacient', kind: 'action' },
    {
      id: 'patient-modals',
      name: 'Modale pacienți',
      description: 'Formular creare/editare și detalii pacient',
      kind: 'modal-group',
      children: [
        { id: 'patient-modal-form', name: 'Modal formular pacient', description: 'Creare și editare pacient', kind: 'modal' },
        { id: 'patient-modal-detail', name: 'Modal detalii pacient', description: 'Vizualizare detalii pacient', kind: 'modal' },
      ],
    },
    { id: 'patient-detail-page', name: 'Pagină detalii pacient', description: 'Vizualizare detalii complete pacient', kind: 'screen' },
    { id: 'patient-create-page', name: 'Pagină creare pacient', description: 'Formular adăugare pacient nou', kind: 'screen' },
    { id: 'patient-edit-page', name: 'Pagină editare pacient', description: 'Formular modificare date pacient', kind: 'screen' },
    { id: 'patient-history', name: 'Istoric pacient', description: 'Vizualizare și modificare istoric medical', kind: 'screen' },
    { id: 'patient-files', name: 'Fișiere pacient', description: 'Scanări, documente și atașamente pacient', kind: 'screen' },
  ],
  appointments: [
    { id: 'appointment-list', name: 'Lista programări', description: 'Pagina principală programări', kind: 'screen' },
    { id: 'appointment-filters', name: 'Filtre programări', description: 'Căutare, dată, doctor, status', kind: 'component' },
    { id: 'appointment-toolbar', name: 'Toolbar programări', description: 'Export, print, coloane', kind: 'component' },
    { id: 'appointment-row-actions', name: 'Acțiuni rând programări', description: 'Vizualizare, editare, ștergere programare', kind: 'action' },
    {
      id: 'appointment-modals',
      name: 'Modale programări',
      description: 'Formular și detalii programare',
      kind: 'modal-group',
      children: [
        { id: 'appointment-modal-form', name: 'Modal formular programare', description: 'Creare și editare programare', kind: 'modal' },
        { id: 'appointment-modal-detail', name: 'Modal detalii programare', description: 'Vizualizare detalii programare', kind: 'modal' },
      ],
    },
    { id: 'appointment-detail-page', name: 'Pagină detalii programare', description: 'Vizualizare detalii complete', kind: 'screen' },
    { id: 'appointment-create-page', name: 'Pagină creare programare', description: 'Formular adăugare programare', kind: 'screen' },
    { id: 'appointment-edit-page', name: 'Pagină editare programare', description: 'Formular modificare programare', kind: 'screen' },
  ],
  consultations: [
    { id: 'consultation-list', name: 'Lista consultații', description: 'Pagina principală consultații', kind: 'screen' },
    { id: 'consultation-filters', name: 'Filtre consultații', description: 'Căutare, dată, doctor, pacient, status', kind: 'component' },
    { id: 'consultation-toolbar', name: 'Toolbar consultații', description: 'Export, print, coloane', kind: 'component' },
    { id: 'consultation-row-actions', name: 'Acțiuni rând consultații', description: 'Vizualizare, editare, ștergere consultație', kind: 'action' },
    {
      id: 'consultation-modals',
      name: 'Modale consultații',
      description: 'Formular și detalii consultație',
      kind: 'modal-group',
      children: [
        { id: 'consultation-modal-form', name: 'Modal formular consultație', description: 'Creare și editare consultație', kind: 'modal' },
        { id: 'consultation-modal-detail', name: 'Modal detalii consultație', description: 'Vizualizare detalii consultație', kind: 'modal' },
      ],
    },
    { id: 'consultation-detail-page', name: 'Pagină detalii consultație', description: 'Vizualizare detalii complete', kind: 'screen' },
    { id: 'consultation-create-page', name: 'Pagină creare consultație', description: 'Formular adăugare consultație', kind: 'screen' },
    { id: 'consultation-edit-page', name: 'Pagină editare consultație', description: 'Formular modificare consultație', kind: 'screen' },
  ],
}

const getModuleObjectConfig = (module: ModuleDto): ModuleObjectConfig[] => {
  const normalizedCode = module.code.toLowerCase()
  if (moduleObjectCatalog[normalizedCode]) return moduleObjectCatalog[normalizedCode]

  if (module.name.toLowerCase().includes('pacient')) return moduleObjectCatalog.patients
  if (module.name.toLowerCase().includes('program')) return moduleObjectCatalog.appointments
  if (module.name.toLowerCase().includes('consulta')) return moduleObjectCatalog.consultations

  return [{ id: `${module.id}-default`, name: module.name, description: 'Acces pe modul', kind: 'screen' }]
}

const flattenObjects = (objects: ModuleObjectConfig[]): ModuleObjectConfig[] =>
  objects.flatMap((obj) => (obj.children && obj.children.length > 0 ? [obj, ...flattenObjects(obj.children)] : [obj]))

const leafObjects = (objects: ModuleObjectConfig[]): ModuleObjectConfig[] =>
  objects.flatMap((obj) => (obj.children && obj.children.length > 0 ? leafObjects(obj.children) : [obj]))

const getLevelPriority = (level: number) => {
  if (level >= 4) return 4
  if (level >= 3) return 3
  if (level >= 2) return 2
  return 1
}

interface LevelSelectorTarget {
  moduleId: string
  objectId: string
}

interface NestedGroupTarget {
  moduleId: string
  group: ModuleObjectConfig
}

interface ObjectCardProps {
  object: ModuleObjectConfig
  levelName: string
  levelCode: string
  isSelected?: boolean
  onClick: () => void
}

const ObjectCard = ({ object, levelName, levelCode, isSelected, onClick }: ObjectCardProps) => (
  <button
    type="button"
    className={`${styles.objectCard} ${isSelected ? styles.objectCardSelected : ''} ${styles[`objectCardKind${object.kind.charAt(0).toUpperCase() + object.kind.slice(1)}`]}`}
    onClick={onClick}
  >
    <div className={styles.objectCardIcon}>{kindIcon(object.kind)}</div>
    <div className={styles.objectCardBody}>
      <div className={styles.objectCardName}>{object.name}</div>
      <div className={styles.objectCardDescription}>{object.description}</div>
      <div className={styles.objectCardMeta}>{kindLabel(object.kind)}</div>
    </div>
    <div className={styles.objectCardFooter}>
      <span className={`${styles.levelBadge} ${levelBadgeClass(levelCode)}`}>{levelName}</span>
      {object.kind === 'modal-group' && object.children && (
        <span className={styles.objectCardSubCount}>{object.children.length} obiecte</span>
      )}
    </div>
  </button>
)

interface LevelSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  objectName: string
  levels: AccessLevelDto[]
  selectedLevelId: string
  onSelect: (levelId: string) => void
}

const LevelSelectorModal = ({ isOpen, onClose, objectName, levels, selectedLevelId, onSelect }: LevelSelectorModalProps) => {
  const selectedLevel = levels.find((l) => l.id === selectedLevelId)

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Alege nivel acces — ${objectName}`}
      maxWidth={520}
      footer={
        <div className={styles.modalActions}>
          <AppButton variant="outline-secondary" size="sm" onClick={onClose}>
            Anulează
          </AppButton>
        </div>
      }
    >
      <div className={styles.levelSelectorGrid}>
        {levels.map((level) => (
          <button
            key={level.id}
            type="button"
            className={`${styles.levelOption} ${levelBadgeClass(level.code)} ${selectedLevelId === level.id ? styles.levelOptionSelected : ''}`}
            onClick={() => onSelect(level.id)}
          >
            <span className={styles.levelOptionName}>{level.name}</span>
            <span className={styles.levelOptionCode}>{level.code}</span>
          </button>
        ))}
      </div>
      {selectedLevel && (
        <div className={styles.levelSelectorHint}>
          Nivel selectat: <strong>{selectedLevel.name}</strong>
        </div>
      )}
    </AppModal>
  )
}

interface NestedObjectsModalProps {
  isOpen: boolean
  onClose: () => void
  module: ModuleDto | undefined
  group: ModuleObjectConfig | null
  selections: Record<string, string>
  levels: AccessLevelDto[]
  defaultLevelId: string
  onSelectObject: (objectId: string) => void
}

const NestedObjectsModal = ({
  isOpen,
  onClose,
  module,
  group,
  selections,
  levels,
  defaultLevelId,
  onSelectObject,
}: NestedObjectsModalProps) => {
  const getLevelById = (id: string) => levels.find((l) => l.id === id)

  if (!group || !module) return null

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${group.name} — ${module.name}`}
      maxWidth={720}
      footer={
        <div className={styles.modalActions}>
          <AppButton variant="primary" size="sm" onClick={onClose}>
            Închide
          </AppButton>
        </div>
      }
    >
      <div className={styles.nestedIntro}>{group.description}</div>
      <div className={styles.objectsGrid}>
        {group.children?.map((child) => {
          const value = selections[child.id] ?? defaultLevelId
          const level = getLevelById(value)
          return (
            <ObjectCard
              key={child.id}
              object={child}
              levelName={level?.name ?? 'Implicit'}
              levelCode={level?.code ?? 'none'}
              onClick={() => onSelectObject(child.id)}
            />
          )
        })}
      </div>
    </AppModal>
  )
}

export const UserOverridesPage = () => {
  const [searchParams] = useSearchParams()
  const preselectedUserId = searchParams.get('userId') ?? ''

  const { data: metaResp, isLoading: loadingMeta } = useModulesAndLevels()
  const { data: usersResp, isLoading: loadingUsers } = useUsersList({
    page: 1,
    pageSize: 500,
    sortBy: 'lastName',
    sortDir: 'asc',
  })

  const modules = useMemo(() => metaResp?.data?.modules ?? [], [metaResp])
  const accessLevels = useMemo(() => metaResp?.data?.accessLevels ?? [], [metaResp])
  const users = useMemo(() => usersResp?.data?.items ?? [], [usersResp])

  const [selectedUserId, setSelectedUserId] = useState<string>(preselectedUserId)
  const [userSearch, setUserSearch] = useState('')
  const [moduleSearch, setModuleSearch] = useState('')
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [levelSelectorTarget, setLevelSelectorTarget] = useState<LevelSelectorTarget | null>(null)
  const [nestedGroupTarget, setNestedGroupTarget] = useState<NestedGroupTarget | null>(null)
  const [moduleObjectSelections, setModuleObjectSelections] = useState<Record<string, Record<string, string>>>({})

  const selectedUser = users.find((u) => u.id === selectedUserId)

  const { data: rolePermResp, isLoading: loadingRolePerm } = useRolePermissions(
    selectedUser?.roleId ?? '',
  )
  const rolePermissions = useMemo(() => rolePermResp?.data ?? [], [rolePermResp])

  const { data: overridesResp, isLoading: loadingOverrides } = useUserOverrides(selectedUserId)
  const existingOverrides = useMemo(() => overridesResp?.data ?? [], [overridesResp])

  const [editMap, setEditMap] = useState<Record<string, ModuleEditState>>({})
  const [isDirty, setIsDirty] = useState(false)

  const sortedLevels = useMemo(
    () => [...accessLevels].sort((a, b) => a.level - b.level),
    [accessLevels],
  )

  const sortedModules = useMemo(
    () => [...modules].sort((a, b) => a.sortOrder - b.sortOrder),
    [modules],
  )

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users
    const search = userSearch.trim().toLowerCase()
    return users.filter((u) => {
      const fullName = `${u.firstName} ${u.lastName}`.toLowerCase()
      return (
        fullName.includes(search) ||
        u.email.toLowerCase().includes(search) ||
        u.roleName.toLowerCase().includes(search)
      )
    })
  }, [userSearch, users])

  const filteredModules = useMemo(() => {
    if (!moduleSearch.trim()) return sortedModules
    const search = moduleSearch.trim().toLowerCase()
    return sortedModules.filter(
      (mod) => mod.name.toLowerCase().includes(search) || mod.code.toLowerCase().includes(search),
    )
  }, [moduleSearch, sortedModules])

  const getLevelById = useCallback(
    (id: string): AccessLevelDto | undefined => sortedLevels.find((l) => l.id === id),
    [sortedLevels],
  )

  const resolveModuleDefaultLevel = useCallback(
    (moduleId: string) => {
      const roleDefault = rolePermissions.find((r) => r.moduleId === moduleId)?.accessLevelId
      return roleDefault ?? sortedLevels[0]?.id ?? ''
    },
    [rolePermissions, sortedLevels],
  )

  const computeModuleLevelFromObjects = useCallback(
    (moduleId: string, selections: Record<string, string>) => {
      const module = modules.find((m) => m.id === moduleId)
      if (!module) return resolveModuleDefaultLevel(moduleId)

      const objects = getModuleObjectConfig(module)
      const leaves = leafObjects(objects)
      if (leaves.length === 0) return resolveModuleDefaultLevel(moduleId)

      let maxPriority = 1
      let winningLevelId = sortedLevels[0]?.id ?? ''

      for (const leaf of leaves) {
        const levelId = selections[leaf.id] ?? resolveModuleDefaultLevel(moduleId)
        const level = getLevelById(levelId)
        const priority = getLevelPriority(level?.level ?? 0)
        if (priority > maxPriority) {
          maxPriority = priority
          winningLevelId = levelId
        }
      }

      return winningLevelId
    },
    [modules, getLevelById, resolveModuleDefaultLevel, sortedLevels],
  )

  const initialMapRef = useMemo(() => {
    const overrideMap = new Map(existingOverrides.map((o) => [o.moduleId, o.accessLevelId]))
    const roleMap = new Map(rolePermissions.map((r) => [r.moduleId, r.accessLevelId]))

    const map: Record<string, ModuleEditState> = {}
    for (const mod of sortedModules) {
      const fallbackLevelId = overrideMap.get(mod.id) ?? roleMap.get(mod.id) ?? sortedLevels[0]?.id ?? ''
      const hasOverride = overrideMap.has(mod.id)
      map[mod.id] = {
        isOverridden: hasOverride,
        accessLevelId: fallbackLevelId,
      }
    }
    return map
  }, [existingOverrides, rolePermissions, sortedLevels, sortedModules])

  useEffect(() => {
    if (!selectedUserId || sortedModules.length === 0) return
    setEditMap(initialMapRef)
    setIsDirty(false)
    setModuleObjectSelections((prev) => {
      const next: Record<string, Record<string, string>> = {}
      for (const mod of sortedModules) {
        const objects = getModuleObjectConfig(mod)
        const leaves = leafObjects(objects)
        const moduleDefault = resolveModuleDefaultLevel(mod.id)
        next[mod.id] = {}
        for (const leaf of leaves) {
          next[mod.id][leaf.id] = prev[mod.id]?.[leaf.id] ?? moduleDefault
        }
      }
      return next
    })
  }, [selectedUserId, initialMapRef, sortedModules, resolveModuleDefaultLevel])

  const updateMutation = useUpdateUserOverrides()
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const handleReset = useCallback(() => {
    setEditMap({ ...initialMapRef })
    setIsDirty(false)
    setModuleObjectSelections(() => {
      const next: Record<string, Record<string, string>> = {}
      for (const mod of sortedModules) {
        const objects = getModuleObjectConfig(mod)
        const leaves = leafObjects(objects)
        const moduleDefault = resolveModuleDefaultLevel(mod.id)
        next[mod.id] = {}
        for (const leaf of leaves) {
          next[mod.id][leaf.id] = moduleDefault
        }
      }
      return next
    })
  }, [initialMapRef, sortedModules, resolveModuleDefaultLevel])

  const handleApplyRoleDefaults = useCallback(() => {
    setEditMap((prev) => {
      const next = { ...prev }
      for (const mod of sortedModules) {
        const roleLevelId = resolveModuleDefaultLevel(mod.id)
        next[mod.id] = {
          isOverridden: false,
          accessLevelId: roleLevelId,
        }
      }
      return next
    })
    setModuleObjectSelections(() => {
      const next: Record<string, Record<string, string>> = {}
      for (const mod of sortedModules) {
        const objects = getModuleObjectConfig(mod)
        const leaves = leafObjects(objects)
        const moduleDefault = resolveModuleDefaultLevel(mod.id)
        next[mod.id] = {}
        for (const leaf of leaves) {
          next[mod.id][leaf.id] = moduleDefault
        }
      }
      return next
    })
    setIsDirty(true)
  }, [resolveModuleDefaultLevel, sortedModules])

  const handleOpenModuleModal = useCallback((moduleId: string) => {
    setSelectedModuleId(moduleId)
  }, [])

  const handleObjectLevelChange = useCallback(
    (moduleId: string, objectId: string, accessLevelId: string) => {
      setModuleObjectSelections((prev) => {
        const next = {
          ...prev,
          [moduleId]: {
            ...(prev[moduleId] ?? {}),
            [objectId]: accessLevelId,
          },
        }

        setEditMap((current) => ({
          ...current,
          [moduleId]: {
            isOverridden: true,
            accessLevelId: computeModuleLevelFromObjects(moduleId, next[moduleId]),
          },
        }))

        return next
      })
      setIsDirty(true)
    },
    [computeModuleLevelFromObjects],
  )

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

  const selectedModule = modules.find((mod) => mod.id === selectedModuleId)
  const selectedModuleObjects = useMemo(
    () => (selectedModule ? getModuleObjectConfig(selectedModule) : []),
    [selectedModule],
  )

  const selectedLevelSelectorObject = useMemo(() => {
    if (!levelSelectorTarget || !selectedModule) return null
    const all = flattenObjects(selectedModuleObjects)
    return all.find((o) => o.id === levelSelectorTarget.objectId) ?? null
  }, [levelSelectorTarget, selectedModule, selectedModuleObjects])

  const overrideCount = useMemo(
    () => Object.values(editMap).filter((state) => state.isOverridden).length,
    [editMap],
  )

  const isLoading = loadingMeta || loadingUsers || loadingRolePerm || loadingOverrides

  return (
    <div className={styles.page}>
      <PageHeader
        title="Override Permisiuni Utilizator"
        subtitle="Configurează excepții de la permisiunile standard ale rolului"
        actions={
          selectedUserId && (
            <AppButton
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || !selectedUserId}
              isLoading={updateMutation.isPending}
              loadingText="Se salvează..."
            >
              <IconSave />
              Salvează
            </AppButton>
          )
        }
      />

      <div className={styles.content}>
        <div className={styles.userSelector}>
          <span className={styles.userLabel}>Utilizator:</span>
          <input
            type="text"
            className={`form-control form-control-sm ${styles.userSearch}`}
            placeholder="Caută utilizator după nume, email sau rol..."
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
          />
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
            {filteredUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.lastName} {u.firstName} ({u.roleName}) — {u.email}
              </option>
            ))}
          </select>
        </div>

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
            <div className={styles.summaryPills}>
              <span className={styles.summaryPill}>{overrideCount} override-uri</span>
              <span className={styles.summaryPill}>{selectedUser.roleName}</span>
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
            <LoadingSpinner size="sm" />
            Se încarcă...
          </div>
        )}

        {!isLoading && selectedUserId && (
          <>
            <div className={styles.toolbar}>
              <input
                type="text"
                className={`form-control form-control-sm ${styles.moduleSearch}`}
                placeholder="Caută modul după denumire sau cod..."
                value={moduleSearch}
                onChange={(e) => setModuleSearch(e.target.value)}
              />

              <div className={styles.toolbarActions}>
                <AppButton variant="outline-secondary" size="sm" onClick={handleApplyRoleDefaults}>
                  Folosește nivelul rolului
                </AppButton>
                <AppButton variant="ghost" size="sm" onClick={handleReset} disabled={!isDirty}>
                  Reset
                </AppButton>
              </div>
            </div>

            <div className={styles.moduleGrid}>
              {filteredModules.map((mod) => {
                const state = editMap[mod.id] ?? {
                  isOverridden: false,
                  accessLevelId: resolveModuleDefaultLevel(mod.id),
                }
                const currentLevel = getLevelById(state.accessLevelId)
                const objects = getModuleObjectConfig(mod)

                return (
                  <button
                    type="button"
                    key={mod.id}
                    className={styles.moduleCard}
                    onClick={() => handleOpenModuleModal(mod.id)}
                  >
                    <div className={styles.cardHeader}>
                      <div>
                        <div className={styles.moduleName}>{mod.name}</div>
                        <div className={styles.moduleCode}>{mod.code}</div>
                      </div>
                      <span className={`${styles.levelBadge} ${levelBadgeClass(currentLevel?.code ?? 'none')}`}>
                        {currentLevel?.name ?? 'Implicit'}
                      </span>
                    </div>

                    <div className={styles.cardBody}>
                      <div className={styles.cardInfo}>Obiecte: {objects.length}</div>
                      <div className={styles.cardInfo}>
                        {state.isOverridden ? 'Override activ' : 'Folosește nivelul rolului'}
                      </div>
                    </div>

                    <div className={styles.cardFooter}>
                      <span className={styles.cardAction}>Configurează</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {filteredModules.length === 0 && (
              <div className={styles.empty}>Nu există module care coincid cu criteriul de căutare.</div>
            )}
          </>
        )}

        {successMsg && (
          <div className={`alert alert-success mt-3 ${styles.feedback}`}>{successMsg}</div>
        )}
        {errorMsg && (
          <div className={`alert alert-danger mt-3 ${styles.feedback}`}>{errorMsg}</div>
        )}
      </div>

      {selectedModule && (
        <AppModal
          isOpen={!!selectedModule}
          onClose={() => setSelectedModuleId(null)}
          title={`Configurare ${selectedModule.name}`}
          maxWidth={820}
          footer={
            <div className={styles.modalActions}>
              <AppButton variant="primary" size="sm" onClick={() => setSelectedModuleId(null)}>
                Închide
              </AppButton>
            </div>
          }
        >
          <div className={styles.modalIntro}>
            Selectează un obiect pentru a-i seta nivelul de acces. Modulul va moșteni nivelul maxim ales.
          </div>
          <div className={styles.objectsGrid}>
            {selectedModuleObjects.map((objectItem) => {
              const currentValue = moduleObjectSelections[selectedModule.id]?.[objectItem.id]
                ?? resolveModuleDefaultLevel(selectedModule.id)
              const currentLevel = getLevelById(currentValue)

              return (
                <ObjectCard
                  key={objectItem.id}
                  object={objectItem}
                  levelName={currentLevel?.name ?? 'Implicit'}
                  levelCode={currentLevel?.code ?? 'none'}
                  onClick={() => {
                    if (objectItem.kind === 'modal-group') {
                      setNestedGroupTarget({ moduleId: selectedModule.id, group: objectItem })
                    } else {
                      setLevelSelectorTarget({ moduleId: selectedModule.id, objectId: objectItem.id })
                    }
                  }}
                />
              )
            })}
          </div>
        </AppModal>
      )}

      <NestedObjectsModal
        isOpen={!!nestedGroupTarget}
        onClose={() => setNestedGroupTarget(null)}
        module={selectedModule}
        group={nestedGroupTarget?.group ?? null}
        selections={nestedGroupTarget && selectedModule ? (moduleObjectSelections[selectedModule.id] ?? {}) : {}}
        levels={sortedLevels}
        defaultLevelId={selectedModule ? resolveModuleDefaultLevel(selectedModule.id) : ''}
        onSelectObject={(objectId) => {
          if (!nestedGroupTarget || !selectedModule) return
          setLevelSelectorTarget({ moduleId: selectedModule.id, objectId })
        }}
      />

      <LevelSelectorModal
        isOpen={!!selectedLevelSelectorObject}
        onClose={() => setLevelSelectorTarget(null)}
        objectName={selectedLevelSelectorObject?.name ?? ''}
        levels={sortedLevels}
        selectedLevelId={
          selectedLevelSelectorObject && selectedModule
            ? (moduleObjectSelections[selectedModule.id]?.[selectedLevelSelectorObject.id]
              ?? resolveModuleDefaultLevel(selectedModule.id))
            : ''
        }
        onSelect={(levelId) => {
          if (!selectedLevelSelectorObject || !selectedModule) return
          handleObjectLevelChange(selectedModule.id, selectedLevelSelectorObject.id, levelId)
          setLevelSelectorTarget(null)
        }}
      />
    </div>
  )
}

export default UserOverridesPage
