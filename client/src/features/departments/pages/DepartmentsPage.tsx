import { useState, useMemo } from 'react'
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
import { useMedicalStaffLookup } from '@/features/medicalStaff/hooks/useMedicalStaff'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { IconPlus } from '@/components/ui/Icons'
import { DoctorViewModal } from '@/features/doctors/components'
import { MedicalStaffViewModal } from '@/features/medicalStaff/components'
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

const IconChevron = ({ expanded }: { expanded: boolean }) => (
  <svg
    className={`${styles.chevronIcon} ${expanded ? styles.chevronExpanded : ''}`}
    viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
  >
    <polyline points="9 18 15 12 9 6" />
  </svg>
)

const IconStar = () => (
  <svg className={styles.starIcon} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const IconDoctor = () => (
  <svg className={styles.doctorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

const IconStaff = () => (
  <svg className={styles.doctorIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
)



// ===== Componenta principală =====
const DepartmentsPage = () => {
  // Date departamente + locații (pentru dropdown)
  const { data: departmentsResp, isLoading: loadingDepts } = useDepartments()
  const { data: locationsResp, isLoading: loadingLocations } = useClinicLocations()
  const { data: doctorsResp } = useDoctorLookup()
  const { data: staffResp } = useMedicalStaffLookup()

  // Mutații
  const createDepartment = useCreateDepartment()
  const updateDepartment = useUpdateDepartment()
  const deleteDepartment = useDeleteDepartment()

  // State modal formular
  const [modalOpen, setModalOpen] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<DepartmentDto | null>(null)

  // State confirmare ștergere
  const [deleteTarget, setDeleteTarget] = useState<DepartmentDto | null>(null)

  // State expandare departamente (master-detail)
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())

  // State vizualizare doctor (readonly modal)
  const [viewDoctorId, setViewDoctorId] = useState<string | null>(null)

  // State vizualizare personal medical (readonly modal)
  const [viewStaffId, setViewStaffId] = useState<string | null>(null)

  // State mesaje feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const departments = departmentsResp?.data ?? []
  const locations = locationsResp?.data ?? []
  const doctors = doctorsResp?.data ?? []
  const staff = staffResp?.data ?? []
  const isLoading = loadingDepts || loadingLocations

  // Grupare doctori per departament (pentru master-detail)
  const doctorsByDept = useMemo(() => {
    const map = new Map<string, typeof doctors>()
    for (const doc of doctors) {
      if (doc.departmentId) {
        const list = map.get(doc.departmentId) ?? []
        list.push(doc)
        map.set(doc.departmentId, list)
      }
    }
    return map
  }, [doctors])

  // Grupare personal medical per departament (pentru master-detail)
  const staffByDept = useMemo(() => {
    const map = new Map<string, typeof staff>()
    for (const s of staff) {
      if (s.departmentId) {
        const list = map.get(s.departmentId) ?? []
        list.push(s)
        map.set(s.departmentId, list)
      }
    }
    return map
  }, [staff])

  // Toggle expandare departament
  const toggleExpand = (deptId: string) => {
    setExpandedDepts((prev) => {
      const next = new Set(prev)
      if (next.has(deptId)) next.delete(deptId)
      else next.add(deptId)
      return next
    })
  }

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
                  <th style={{ width: '36px' }}></th>
                  <th>Denumire</th>
                  <th>Cod</th>
                  <th>Locație</th>
                  <th>Șef departament</th>
                  <th>Nr. medici</th>
                  <th>Nr. personal</th>
                  <th>Descriere</th>
                  <th>Status</th>
                  <th style={{ width: '80px' }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => {
                  const isExpanded = expandedDepts.has(dept.id)
                  const deptDoctors = doctorsByDept.get(dept.id) ?? []
                  const deptStaff = staffByDept.get(dept.id) ?? []
                  const hasMembers = deptDoctors.length > 0 || deptStaff.length > 0
                  // Sortare: șeful departamentului primul
                  const sortedDoctors = [...deptDoctors].sort((a, b) => {
                    if (a.id === dept.headDoctorId) return -1
                    if (b.id === dept.headDoctorId) return 1
                    return a.fullName.localeCompare(b.fullName)
                  })

                  return (
                    <>
                      <tr key={dept.id} className={isExpanded ? styles.rowExpanded : ''}>
                        <td className={styles.expandCell}>
                          {hasMembers && (
                            <button
                              className={styles.expandBtn}
                              onClick={() => toggleExpand(dept.id)}
                              aria-label={isExpanded ? 'Restrânge' : 'Expandează'}
                            >
                              <IconChevron expanded={isExpanded} />
                            </button>
                          )}
                        </td>
                        <td>
                          <span
                            className={hasMembers ? styles.clickableName : ''}
                            onClick={() => hasMembers && toggleExpand(dept.id)}
                          >
                            {dept.name}
                          </span>
                        </td>
                        <td>
                          <span className={styles.codeTag}>{dept.code}</span>
                        </td>
                        <td>{dept.locationName ?? '—'}</td>
                        <td>{dept.headDoctorName ?? '—'}</td>
                        <td className="text-center">{dept.doctorCount}</td>
                        <td className="text-center">{dept.medicalStaffCount}</td>
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

                      {/* ===== Detail row: doctori + personal medical din departament ===== */}
                      {isExpanded && (
                        <tr key={`${dept.id}-detail`} className={styles.detailRow}>
                          <td colSpan={10} className={styles.detailCell}>
                            <div className={styles.detailContent}>
                              {/* Secțiune medici */}
                              <div className={styles.detailHeader}>
                                <IconDoctor />
                                <span>Medici în departamentul <strong>{dept.name}</strong></span>
                              </div>
                              {sortedDoctors.length === 0 ? (
                                <p className={styles.detailEmpty}>Niciun medic asignat.</p>
                              ) : (
                                <div className={styles.doctorList}>
                                  {sortedDoctors.map((doc) => {
                                    const isHead = doc.id === dept.headDoctorId
                                    return (
                                      <div
                                        key={doc.id}
                                        className={`${styles.doctorCard} ${isHead ? styles.doctorCardHead : ''}`}
                                        onClick={() => setViewDoctorId(doc.id)}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => e.key === 'Enter' && setViewDoctorId(doc.id)}
                                      >
                                        <div className={styles.doctorAvatar}>
                                          {isHead ? <IconStar /> : <IconDoctor />}
                                        </div>
                                        <div className={styles.doctorInfo}>
                                          <span className={styles.doctorName}>
                                            {doc.fullName}
                                            {isHead && (
                                              <span className={styles.headBadge}>Șef</span>
                                            )}
                                          </span>
                                          <span className={styles.doctorSpec}>
                                            {doc.specialtyName ?? 'Fără specialitate'}
                                            {doc.medicalCode && ` · ${doc.medicalCode}`}
                                          </span>
                                        </div>
                                      </div>
                                    )
                                  })}
                                </div>
                              )}

                              {/* Secțiune personal medical */}
                              <div className={`${styles.detailHeader} ${styles.staffSection}`}>
                                <IconStaff />
                                <span>Personal medical în departamentul <strong>{dept.name}</strong></span>
                              </div>
                              {deptStaff.length === 0 ? (
                                <p className={styles.detailEmpty}>Niciun personal medical asignat.</p>
                              ) : (
                                <div className={styles.doctorList}>
                                  {deptStaff.map((s) => (
                                    <div
                                      key={s.id}
                                      className={styles.doctorCard}
                                      onClick={() => setViewStaffId(s.id)}
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => e.key === 'Enter' && setViewStaffId(s.id)}
                                    >
                                      <div className={styles.doctorAvatar}>
                                        <IconStaff />
                                      </div>
                                      <div className={styles.doctorInfo}>
                                        <span className={styles.doctorName}>{s.fullName}</span>
                                        <span className={styles.doctorSpec}>
                                          {s.medicalTitleName ?? 'Fără titulatură'}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== Modal vizualizare doctor (readonly) ===== */}
      <DoctorViewModal
        doctorId={viewDoctorId}
        onClose={() => setViewDoctorId(null)}
      />

      {/* ===== Modal vizualizare personal medical (readonly) ===== */}
      <MedicalStaffViewModal
        staffId={viewStaffId}
        onClose={() => setViewStaffId(null)}
      />

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
