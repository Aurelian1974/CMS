import { useState, useMemo, useCallback } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AppButton } from '@/components/ui/AppButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import {
  useMedicalTitles,
  useCreateMedicalTitle,
  useUpdateMedicalTitle,
  useToggleMedicalTitle,
} from '@/features/nomenclature/hooks/useMedicalTitles'
import { MedicalTitleFormModal } from '@/features/nomenclature/components/MedicalTitleFormModal/MedicalTitleFormModal'
import type { MedicalTitleDto } from '@/features/nomenclature/types/medicalTitle.types'
import type { MedicalTitleFormData } from '@/features/nomenclature/schemas/medicalTitle.schema'
import styles from './MedicalTitlesPage.module.scss'

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

// ===== Pagina principală =====

export const MedicalTitlesPage = () => {
  // State
  const [showInactive, setShowInactive] = useState(false)
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem, setEditItem] = useState<MedicalTitleDto | null>(null)

  // Hooks date
  const { data: titlesResponse, isLoading, isError } = useMedicalTitles(showInactive ? undefined : true)
  const createMutation = useCreateMedicalTitle()
  const updateMutation = useUpdateMedicalTitle()
  const toggleMutation = useToggleMedicalTitle()

  const titles = titlesResponse?.data ?? []

  // Filtrare text
  const filteredTitles = useMemo(() => {
    if (!search.trim()) return titles
    const lowerSearch = search.toLowerCase()
    return titles.filter(
      (t) =>
        t.name.toLowerCase().includes(lowerSearch) ||
        t.code.toLowerCase().includes(lowerSearch)
    )
  }, [titles, search])

  // Acțiuni CRUD
  const handleOpenCreate = useCallback(() => {
    setEditItem(null)
    setModalOpen(true)
  }, [])

  const handleEdit = useCallback((item: MedicalTitleDto) => {
    setEditItem(item)
    setModalOpen(true)
  }, [])

  const handleCloseModal = useCallback(() => {
    setModalOpen(false)
    setEditItem(null)
  }, [])

  const handleSubmit = async (data: MedicalTitleFormData) => {
    try {
      if (editItem) {
        await updateMutation.mutateAsync({ id: editItem.id, ...data })
      } else {
        await createMutation.mutateAsync(data)
      }
      handleCloseModal()
    } catch {
      // Eroarea e propagată de Axios interceptor
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id, isActive })
    } catch {
      // eroare gestionată de interceptor
    }
  }

  return (
    <div className={styles.page}>
      <PageHeader
        title="Titulaturi Medicale"
        subtitle={`${titles.length} titulaturi`}
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
            placeholder="Caută titulatură după denumire sau cod…"
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
          </div>
        </div>

        {/* Conținut tabel */}
        {isLoading && (
          <div className="d-flex justify-content-center py-5">
            <LoadingSpinner />
          </div>
        )}

        {isError && (
          <div className="alert alert-danger">
            Nu s-au putut încărca titularturile medicale. Verificați conexiunea la server.
          </div>
        )}

        {!isLoading && !isError && filteredTitles.length === 0 && (
          <div className={styles.emptyState}>
            {search
              ? `Niciun rezultat pentru „${search}"`
              : 'Nu există titulaturi medicale configurate.'}
          </div>
        )}

        {!isLoading && !isError && filteredTitles.length > 0 && (
          <div className={styles.tableContainer}>
            {/* Header */}
            <div className={styles.tableHeader}>
              <div className={styles.headerOrder}>#</div>
              <div className={styles.headerName}>Denumire</div>
              <div className={styles.headerCode}>Cod</div>
              <div className={styles.headerDesc}>Descriere</div>
              <div className={styles.headerStatus}>Stare</div>
              <div className={styles.headerActions}>Acțiuni</div>
            </div>

            {/* Rânduri */}
            {filteredTitles.map((item) => (
              <div key={item.id} className={styles.tableRow}>
                <div className={styles.cellOrder}>{item.displayOrder}</div>

                <div className={styles.cellName}>{item.name}</div>

                <div className={styles.cellCode}>{item.code}</div>

                <div className={styles.cellDesc}>
                  {item.description || <span className={styles.noData}>—</span>}
                </div>

                <button
                  className={`${styles.statusBadge} ${item.isActive ? styles.active : styles.inactive}`}
                  onClick={() => handleToggleActive(item.id, !item.isActive)}
                  title={item.isActive ? 'Click pentru dezactivare' : 'Click pentru activare'}
                >
                  {item.isActive ? 'Activ' : 'Inactiv'}
                </button>

                <button
                  className={styles.actionBtn}
                  onClick={() => handleEdit(item)}
                  title="Editează"
                >
                  <IconEdit />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal creare/editare */}
      <MedicalTitleFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
        editData={editItem}
      />
    </div>
  )
}

export default MedicalTitlesPage
