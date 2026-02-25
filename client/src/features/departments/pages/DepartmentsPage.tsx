import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { DepartmentFormModal } from '../components/DepartmentFormModal'
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
} from '../hooks/useDepartments'
import { useClinicLocations } from '@/features/clinic/hooks/useClinic'
import { useDoctorLookup } from '@/features/doctors/hooks/useDoctors'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { IconPlus } from '@/components/ui/Icons'
import type { DepartmentDto, CreateDepartmentPayload } from '../types/department.types'
import type { DepartmentFormData } from '../schemas/department.schema'
import styles from './DepartmentsPage.module.scss'

// ===== Icoane SVG inline =====
const IconDepartment = () => (
  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
)



// ===== Componenta principală =====
const DepartmentsPage = () => {
  // Date departamente + locații (pentru dropdown)
  const { data: departmentsResp, isLoading: loadingDepts } = useDepartments()
  const { data: locationsResp, isLoading: loadingLocations } = useClinicLocations()
  const { data: doctorsResp } = useDoctorLookup()

  // Mutații
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const deleteDepartment = useDeleteDepartment()

  // State modal formular
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<DepartmentDto | null>(null)

  // State confirmare ștergere
  const [deleteTarget, setDeleteTarget] = useState<DepartmentDto | null>(null)

  // State mesaje feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const departments = departmentsResp?.data ?? []
  const locations = locationsResp?.data ?? []
  const doctors = doctorsResp?.data ?? []
  const isLoading = loadingDepts || loadingLocations

  // Funcții helper — afișare mesaje feedback
  const showSuccess = (msg: string) => {
    setErrorMsg(null)
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const showError = (err: unknown) => {
    setSuccessMsg(null)
    const message = err instanceof Error ? err.message : 'A apărut o eroare neașteptată.'
    setErrorMsg(message)
  }

  // ===== Handlers =====

  const handleOpenCreate = () => {
    setEditingDepartment(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (dept: DepartmentDto) => {
    setEditingDepartment(dept)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingDepartment(null)
  }

  const handleFormSubmit = (data: DepartmentFormData) => {
    if (editingDepartment) {
      updateDepartment.mutate(
        {
          id: editingDepartment.id,
          locationId: data.locationId,
          name: data.name,
          code: data.code,
          description: data.description || null,
          headDoctorId: data.headDoctorId || null,
          isActive: data.isActive,
        },
        {
          onSuccess: () => {
            handleCloseModal()
            showSuccess('Departamentul a fost actualizat cu succes.')
          },
          onError: (err) => showError(err),
        },
      )
    } else {
      const payload: CreateDepartmentPayload = {
        locationId: data.locationId,
        name: data.name,
        code: data.code,
        description: data.description || null,
      }
      createDepartment.mutate(payload, {
        onSuccess: () => {
          handleCloseModal()
          showSuccess('Departamentul a fost adăugat cu succes.')
        },
        onError: (err) => showError(err),
      })
    }
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteDepartment.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null)
        showSuccess('Departamentul a fost șters cu succes.')
      },
      onError: (err) => {
        setDeleteTarget(null)
        showError(err)
      },
    })
  }

  // ===== Loading state =====
  if (isLoading) {
    return (
      <div className={styles.page}>
        <PageHeader title="Departamente" subtitle="Gestionare departamente clinică" />
        <div className={styles.loadingWrap}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Se încarcă...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Departamente" subtitle={`${departments.length} departamente`} />

      {/* Mesaj succes */}
      {successMsg && (
        <div className="alert alert-success alert-dismissible fade show mb-0" role="alert">
          {successMsg}
          <button type="button" className="btn-close" onClick={() => setSuccessMsg(null)} />
        </div>
      )}

      {/* Mesaj eroare */}
      {errorMsg && (
        <div className="alert alert-danger alert-dismissible fade show mb-0" role="alert">
          {errorMsg}
          <button type="button" className="btn-close" onClick={() => setErrorMsg(null)} />
        </div>
      )}

      {/* ======= SECȚIUNE: Departamente ======= */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <IconDepartment />
            Departamente
          </h2>
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreate}>
            <IconPlus /> Adaugă departament
          </button>
        </div>

        {departments.length === 0 ? (
          <div className={styles.emptyState}>
            <IconDepartment />
            <p>Nu există departamente definite. Adaugă primul departament.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th>Denumire</th>
                  <th>Cod</th>
                  <th>Locație</th>
                  <th>Șef departament</th>
                  <th>Nr. medici</th>
                  <th>Descriere</th>
                  <th>Status</th>
                  <th style={{ width: '80px' }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id}>
                    <td>{dept.name}</td>
                    <td>
                      <span className={styles.codeTag}>{dept.code}</span>
                    </td>
                    <td>{dept.locationName ?? '—'}</td>
                    <td>{dept.headDoctorName ?? '—'}</td>
                    <td className="text-center">{dept.doctorCount}</td>
                    <td className={styles.descriptionCell}>{dept.description || '—'}</td>
                    <td>
                      <span className={dept.isActive ? styles.badgeActive : styles.badgeInactive}>
                        {dept.isActive ? 'Activ' : 'Inactiv'}
                      </span>
                    </td>
                    <td>
                      <ActionButtons
                        onEdit={() => handleOpenEdit(dept)}
                        onDelete={() => setDeleteTarget(dept)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Modal formular departament ===== */}
      <DepartmentFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleFormSubmit}
        isLoading={createDepartment.isPending || updateDepartment.isPending}
        editData={editingDepartment}
        locations={locations}
        doctors={doctors}
      />

      {/* ===== Dialog confirmare ștergere ===== */}
      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h5>Confirmare ștergere</h5>
            <p>
              Ești sigur că vrei să ștergi departamentul <strong>{deleteTarget.name}</strong>?
              Această acțiune nu poate fi anulată.
            </p>
            <div className={styles.confirmActions}>
              <button
                className="btn btn-outline-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteDepartment.isPending}
              >
                Anulează
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleteDepartment.isPending}
              >
                {deleteDepartment.isPending ? 'Se șterge...' : 'Șterge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DepartmentsPage
