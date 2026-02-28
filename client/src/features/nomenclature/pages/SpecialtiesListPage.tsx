import { useState, useMemo, useCallback } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AppButton } from '@/components/ui/AppButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useSpecialtyTree, useCreateSpecialty, useUpdateSpecialty, useToggleSpecialty } from '@/features/nomenclature/hooks/useSpecialties'
import { SpecialtyFormModal } from '@/features/nomenclature/components/SpecialtyFormModal/SpecialtyFormModal'
import type { SpecialtyDto, SpecialtyTreeNode } from '@/features/nomenclature/types/specialty.types'
import type { SpecialtyFormData } from '@/features/nomenclature/schemas/specialty.schema'
import styles from './SpecialtiesListPage.module.scss'

// ===== Icoane SVG inline =====

const IconPlus = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
)

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
)

const IconChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="6 9 12 15 18 9" />
  </svg>
)

const IconChevronRight = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

// ===== Etichete nivel =====
const LEVEL_LABEL: Record<number, string> = {
  0: 'Categorie',
  1: 'Specialitate',
  2: 'Subspecialitate',
}

const LEVEL_CLASS: Record<number, string> = {
  0: 'category',
  1: 'specialty',
  2: 'subspecialty',
}

// ===== Componenta rând arvore (recursivă) =====

interface TreeRowProps {
  node: SpecialtyTreeNode
  expanded: Set<string>
  toggleExpand: (id: string) => void
  onEdit: (node: SpecialtyTreeNode) => void
  onToggleActive: (id: string, isActive: boolean) => void
}

const TreeRow = ({ node, expanded, toggleExpand, onEdit, onToggleActive }: TreeRowProps) => {
  const hasChildren = node.children.length > 0
  const isExpanded = expanded.has(node.id)

  return (
    <>
      <div
        className={`${styles.treeRow} ${styles[LEVEL_CLASS[node.level] ?? 'specialty']}`}
        style={{ paddingLeft: `${node.level * 1.5 + 0.75}rem` }}
      >
        {/* Expand/collapse */}
        <button
          className={styles.expandBtn}
          onClick={() => hasChildren && toggleExpand(node.id)}
          disabled={!hasChildren}
          aria-label={isExpanded ? 'Restrânge' : 'Extinde'}
        >
          {hasChildren && (isExpanded ? <IconChevronDown /> : <IconChevronRight />)}
        </button>

        {/* Informații nod */}
        <div className={styles.nodeInfo}>
          <span className={styles.nodeName}>{node.name}</span>
          <span className={styles.nodeCode}>{node.code}</span>
        </div>

        {/* Badge nivel */}
        <span className={`${styles.levelBadge} ${styles[LEVEL_CLASS[node.level] ?? 'specialty']}`}>
          {LEVEL_LABEL[node.level] ?? '—'}
        </span>

        {/* Stare activ/inactiv */}
        <button
          className={`${styles.statusBadge} ${node.isActive ? styles.active : styles.inactive}`}
          onClick={() => onToggleActive(node.id, !node.isActive)}
          title={node.isActive ? 'Click pentru dezactivare' : 'Click pentru activare'}
        >
          {node.isActive ? 'Activ' : 'Inactiv'}
        </button>

        {/* Acțiuni */}
        <button
          className={styles.actionBtn}
          onClick={() => onEdit(node)}
          title="Editează"
        >
          <IconEdit />
        </button>
      </div>

      {/* Copii recursiv */}
      {hasChildren && isExpanded && (
        <div className={styles.childrenBlock}>
          {node.children.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              expanded={expanded}
              toggleExpand={toggleExpand}
              onEdit={onEdit}
              onToggleActive={onToggleActive}
            />
          ))}
        </div>
      )}
    </>
  )
}

// ===== Pagina principală =====

export const SpecialtiesListPage = () => {
  // State
  const [showInactive, setShowInactive] = useState(false)
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [editNode, setEditNode] = useState<SpecialtyTreeNode | null>(null)

  // Hooks date
  const { data: treeResponse, isLoading, isError } = useSpecialtyTree(showInactive ? undefined : true)
  const createMutation = useCreateSpecialty()
  const updateMutation = useUpdateSpecialty()
  const toggleMutation = useToggleSpecialty()

  const treeData = treeResponse?.data ?? []

  // Construiește lista flat de opțiuni parent din arbore
  const parentOptions = useMemo(() => {
    const opts: { id: string; name: string; level: number }[] = []
    const collect = (nodes: SpecialtyTreeNode[]) => {
      for (const node of nodes) {
        if (node.level <= 1) {
          opts.push({ id: node.id, name: node.name, level: node.level })
        }
        if (node.children.length > 0) collect(node.children)
      }
    }
    collect(treeData)
    return opts
  }, [treeData])

  // Filtrare text în arbore (filtrează recursiv)
  const filteredTree = useMemo(() => {
    if (!search.trim()) return treeData
    const lowerSearch = search.toLowerCase()

    const filterNode = (node: SpecialtyTreeNode): SpecialtyTreeNode | null => {
      const matchesSelf =
        node.name.toLowerCase().includes(lowerSearch) ||
        node.code.toLowerCase().includes(lowerSearch)

      const filteredChildren = node.children
        .map(filterNode)
        .filter((c): c is SpecialtyTreeNode => c !== null)

      if (matchesSelf || filteredChildren.length > 0) {
        return { ...node, children: matchesSelf ? node.children : filteredChildren }
      }
      return null
    }

    return treeData
      .map(filterNode)
      .filter((n): n is SpecialtyTreeNode => n !== null)
  }, [treeData, search])

  // Expand/collapse
  const toggleExpand = useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  // Expand all / Collapse all
  const expandAll = useCallback(() => {
    const ids = new Set<string>()
    const collect = (nodes: SpecialtyTreeNode[]) => {
      for (const node of nodes) {
        if (node.children.length > 0) {
          ids.add(node.id)
          collect(node.children)
        }
      }
    }
    collect(treeData)
    setExpanded(ids)
  }, [treeData])

  const collapseAll = useCallback(() => setExpanded(new Set()), [])

  // Acțiuni CRUD
  const handleOpenCreate = () => {
    setEditNode(null)
    setModalOpen(true)
  }

  const handleEdit = (node: SpecialtyTreeNode) => {
    // Convertim tree node → format compatibil cu form/edit
    setEditNode(node)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditNode(null)
  }

  const handleSubmit = async (data: SpecialtyFormData) => {
    try {
      if (editNode) {
        await updateMutation.mutateAsync({
          id: editNode.id,
          ...data,
        })
      } else {
        await createMutation.mutateAsync(data)
      }
      handleCloseModal()
    } catch {
      // Eroarea e propagată de Axios interceptor — TanStack Query o afișează
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id, isActive })
    } catch {
      // eroare gestionată de interceptor
    }
  }

  // Contorizare totale
  const totalCount = useMemo(() => {
    let count = 0
    const countNodes = (nodes: SpecialtyTreeNode[]) => {
      for (const node of nodes) {
        count++
        countNodes(node.children)
      }
    }
    countNodes(treeData)
    return count
  }, [treeData])

  return (
    <div className={styles.page}>
      <PageHeader
        title="Specializări Medicale"
        subtitle={`${totalCount} specializări`}
        actions={
          <AppButton variant="primary" onClick={handleOpenCreate}>
            <IconPlus /> Adaugă
          </AppButton>
        }
      />

      <div className={styles.content}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <input
            type="text"
            className="form-control"
            placeholder="Caută specializare după denumire sau cod…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: 360 }}
          />

          <div className={styles.toolbarRight}>
            <label className={styles.checkLabel}>
              <input
                type="checkbox"
                className="form-check-input me-2"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Arată inactive
            </label>

            <AppButton variant="outline-secondary" size="sm" onClick={expandAll}>
              Extinde tot
            </AppButton>
            <AppButton variant="outline-secondary" size="sm" onClick={collapseAll}>
              Restrânge tot
            </AppButton>
          </div>
        </div>

        {/* Conținut arbore */}
        {isLoading && (
          <div className="d-flex justify-content-center py-5">
            <LoadingSpinner />
          </div>
        )}

        {isError && (
          <div className="alert alert-danger">
            Nu s-au putut încărca specializările. Verificați conexiunea la server.
          </div>
        )}

        {!isLoading && !isError && filteredTree.length === 0 && (
          <div className={styles.emptyState}>
            {search
              ? `Niciun rezultat pentru „${search}"`
              : 'Nu există specializări configurate.'}
          </div>
        )}

        {!isLoading && !isError && filteredTree.length > 0 && (
          <div className={styles.treeContainer}>
            {/* Header rând */}
            <div className={styles.treeHeader}>
              <div className={styles.headerExpand} />
              <div className={styles.headerInfo}>Denumire</div>
              <div className={styles.headerLevel}>Nivel</div>
              <div className={styles.headerStatus}>Stare</div>
              <div className={styles.headerActions}>Acțiuni</div>
            </div>

            {filteredTree.map((node) => (
              <TreeRow
                key={node.id}
                node={node}
                expanded={expanded}
                toggleExpand={toggleExpand}
                onEdit={handleEdit}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal creare/editare */}
      <SpecialtyFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
        editData={editNode as unknown as SpecialtyDto | null}
        parentOptions={parentOptions}
      />
    </div>
  )
}

export default SpecialtiesListPage
