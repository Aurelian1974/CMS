import { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { LocationFormModal } from '../components/LocationFormModal'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { IconPlus } from '@/components/ui/Icons'
import { FormInput } from '@/components/forms/FormInput'
import { CaenCodeMultiSelect } from '@/components/forms/CaenCodeMultiSelect'
import { AppButton } from '@/components/ui/AppButton'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { clinicSchema, type ClinicFormData } from '../schemas/clinic.schema'
import type { ClinicLocationDto, ClinicLocationFormData, UpdateClinicPayload } from '../types/clinic.types'
import {
  useCurrentClinic,
  useClinicLocations,
  useUpdateClinic,
  useCreateClinicLocation,
  useUpdateClinicLocation,
  useDeleteClinicLocation,
} from '../hooks/useClinic'
import { useDepartments } from '@/features/departments/hooks/useDepartments'
import styles from './ClinicPage.module.scss'

// ===== Icoane SVG inline =====
const IconCompany = () => (
  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" /><line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" /><line x1="15" y1="3" x2="15" y2="21" />
  </svg>
)

const IconLocation = () => (
  <svg className={styles.sectionIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
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

const IconDepartment = () => (
  <svg className={styles.deptIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
  </svg>
)

const IconStar = () => (
  <svg className={styles.starIcon} viewBox="0 0 24 24" fill="currentColor" stroke="none">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
)

const IconDoctor = () => (
  <svg className={styles.doctorSmIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)



// ===== Componenta principală =====
const ClinicPage = () => {
  // Date clinică + locații
  const { data: clinicResp, isLoading: loadingClinic } = useCurrentClinic()
  const { data: locationsResp, isLoading: loadingLocations } = useClinicLocations()

  // Mutații
  const updateClinic = useUpdateClinic()
  const createLocation = useCreateClinicLocation()
  const updateLocation = useUpdateClinicLocation()
  const deleteLocation = useDeleteClinicLocation()

  // State modal locații
  const [modalOpen, setModalOpen] = useState(false)
  const [editingLocation, setEditingLocation] = useState<ClinicLocationDto | null>(null)

  // State confirmare ștergere
  const [deleteTarget, setDeleteTarget] = useState<ClinicLocationDto | null>(null)

  // State expandare locații (master-detail)
  const [expandedLocs, setExpandedLocs] = useState<Set<string>>(new Set())

  // State mesaje feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Formular clinică
  const {
    control,
    handleSubmit,
    reset,
    formState: { isDirty },
  } = useForm<ClinicFormData>({
    resolver: zodResolver(clinicSchema),
  })

  // Populare formular cu datele clinicii
  const clinic = clinicResp?.data ?? null
  useEffect(() => {
    if (clinic) {
      reset({
        name: clinic.name,
        fiscalCode: clinic.fiscalCode,
        tradeRegisterNumber: clinic.tradeRegisterNumber ?? '',
        caenCodes: (clinic.caenCodes ?? []).map((cc) => ({
          id: cc.caenCodeId,
          code: cc.code,
          name: cc.name,
          level: cc.level,
          isActive: true,
        })),
        legalRepresentative: clinic.legalRepresentative ?? '',
        contractCNAS: clinic.contractCNAS ?? '',
        address: clinic.address,
        city: clinic.city,
        county: clinic.county,
        postalCode: clinic.postalCode ?? '',
        bankName: clinic.bankName ?? '',
        bankAccount: clinic.bankAccount ?? '',
        email: clinic.email ?? '',
        phoneNumber: clinic.phoneNumber ?? '',
        website: clinic.website ?? '',
      })
    }
  }, [clinic, reset])

  // Date departamente (pentru master-detail locații)
  const { data: departmentsResp } = useDepartments()

  const locations = locationsResp?.data ?? []
  const departments = departmentsResp?.data ?? []
  const isLoading = loadingClinic || loadingLocations

  // Grupare departamente per locație (pentru master-detail)
  const deptsByLocation = useMemo(() => {
    const map = new Map<string, typeof departments>()
    for (const dept of departments) {
      if (dept.locationId) {
        const list = map.get(dept.locationId) ?? []
        list.push(dept)
        map.set(dept.locationId, list)
      }
    }
    return map
  }, [departments])

  // Toggle expandare locație
  const toggleExpandLoc = (locId: string) => {
    setExpandedLocs((prev) => {
      const next = new Set(prev)
      if (next.has(locId)) next.delete(locId)
      else next.add(locId)
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

  const handleSaveClinic = (data: ClinicFormData) => {
    const payload: UpdateClinicPayload = {
      name: data.name,
      fiscalCode: data.fiscalCode,
      tradeRegisterNumber: data.tradeRegisterNumber ?? null,
      caenCodeIds: data.caenCodes.map((c) => c.id),
      legalRepresentative: data.legalRepresentative ?? null,
      contractCNAS: data.contractCNAS ?? null,
      address: data.address,
      city: data.city,
      county: data.county,
      postalCode: data.postalCode ?? null,
      bankName: data.bankName ?? null,
      bankAccount: data.bankAccount ?? null,
      email: data.email ?? null,
      phoneNumber: data.phoneNumber ?? null,
      website: data.website ?? null,
    }
    updateClinic.mutate(payload, {
      onSuccess: () => showSuccess('Datele clinicii au fost actualizate cu succes.'),
      onError: (err) => showError(err),
    })
  }

  const handleOpenCreateLocation = () => {
    setEditingLocation(null)
    setModalOpen(true)
  }

  const handleOpenEditLocation = (loc: ClinicLocationDto) => {
    setEditingLocation(loc)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setEditingLocation(null)
  }

  const handleLocationSubmit = (data: ClinicLocationFormData) => {
    if (editingLocation) {
      updateLocation.mutate(
        { id: editingLocation.id, ...data },
        {
          onSuccess: () => {
            handleCloseModal()
            showSuccess('Locația a fost actualizată cu succes.')
          },
          onError: (err) => showError(err),
        },
      )
    } else {
      createLocation.mutate(data, {
        onSuccess: () => {
          handleCloseModal()
          showSuccess('Locația a fost adăugată cu succes.')
        },
        onError: (err) => showError(err),
      })
    }
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget) return
    deleteLocation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null)
        showSuccess('Locația a fost ștearsă cu succes.')
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
        <PageHeader title="Clinica" subtitle="Date societate comercială" />
        <div className={styles.loadingWrap}>
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <PageHeader title="Clinica" subtitle="Date societate comercială și locații" />

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

      {/* ======= SECȚIUNE: Date societate comercială ======= */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <IconCompany />
            Date societate comercială
          </h2>
        </div>

        <form onSubmit={handleSubmit(handleSaveClinic)} noValidate>
          <div className={styles.formGrid}>
            {/* Identificare firmă */}
            <FormInput name="name" control={control} label="Denumire societate" placeholder="ex: S.C. Clinica Medicală S.R.L." required />
            <FormInput name="fiscalCode" control={control} label="CUI / CIF" placeholder="ex: RO12345678" required />
            <FormInput name="tradeRegisterNumber" control={control} label="Nr. Registrul Comerțului" placeholder="ex: J40/1234/2020" />
            <div className={styles.fullWidth}>
              <CaenCodeMultiSelect name="caenCodes" control={control} label="Coduri CAEN" />
            </div>
            <FormInput name="legalRepresentative" control={control} label="Reprezentant legal" placeholder="ex: Dr. Popescu Ion" />
            <FormInput name="contractCNAS" control={control} label="Nr. contract CNAS" placeholder="ex: 12345/2024" />

            {/* Separator vizual — Sediu social */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <hr className="my-1" />
              <label className={styles.label} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Sediu social
              </label>
            </div>

            <FormInput name="address" control={control} label="Adresă" placeholder="ex: Str. Sănătății nr. 10, Sector 1" required className={styles.fullWidth} />
            <FormInput name="city" control={control} label="Oraș" placeholder="ex: București" required />
            <FormInput name="county" control={control} label="Județ" placeholder="ex: București" required />
            <FormInput name="postalCode" control={control} label="Cod poștal" placeholder="ex: 010100" />

            {/* Separator vizual — Date bancare */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <hr className="my-1" />
              <label className={styles.label} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Date bancare
              </label>
            </div>

            <FormInput name="bankName" control={control} label="Banca" placeholder="ex: Banca Transilvania" />
            <div style={{ gridColumn: 'span 2' }}>
              <FormInput name="bankAccount" control={control} label="Cont IBAN" placeholder="ex: RO49AAAA1B31007593840000" />
            </div>

            {/* Separator vizual — Contact */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <hr className="my-1" />
              <label className={styles.label} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Date de contact
              </label>
            </div>

            <FormInput name="email" control={control} label="Email" type="email" placeholder="ex: contact@clinica.ro" />
            <FormInput name="phoneNumber" control={control} label="Telefon" placeholder="ex: 021 123 4567" />
            <FormInput name="website" control={control} label="Website" placeholder="ex: www.clinica.ro" />
          </div>

          {/* Buton salvare */}
          <div className={styles.formActions}>
            <AppButton
              type="submit"
              variant="primary"
              disabled={!isDirty}
              isLoading={updateClinic.isPending}
              loadingText="Se salvează..."
            >
              Salvează modificările
            </AppButton>
          </div>
        </form>
      </div>

      {/* ======= SECȚIUNE: Locații ======= */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>
            <IconLocation />
            Locații
          </h2>
          <AppButton variant="primary" size="sm" onClick={handleOpenCreateLocation}>
            <IconPlus /> Adaugă locație
          </AppButton>
        </div>

        {locations.length === 0 ? (
          <div className={styles.emptyState}>
            <IconLocation />
            <p>Nu există locații definite. Adaugă prima locație.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className={styles.locationsTable}>
              <thead>
                <tr>
                  <th style={{ width: '36px' }}></th>
                  <th>Denumire</th>
                  <th>Adresă</th>
                  <th>Oraș</th>
                  <th>Telefon</th>
                  <th>Tip</th>
                  <th>Status</th>
                  <th style={{ width: '80px' }}>Acțiuni</th>
                </tr>
              </thead>
              <tbody>
                {locations.map((loc) => {
                  const isExpanded = expandedLocs.has(loc.id)
                  const locDepts = deptsByLocation.get(loc.id) ?? []

                  return (
                    <>
                      <tr key={loc.id} className={isExpanded ? styles.rowExpanded : ''}>
                        <td className={styles.expandCell}>
                          {locDepts.length > 0 && (
                            <button
                              className={styles.expandBtn}
                              onClick={() => toggleExpandLoc(loc.id)}
                              aria-label={isExpanded ? 'Restrânge' : 'Expandează'}
                            >
                              <IconChevron expanded={isExpanded} />
                            </button>
                          )}
                        </td>
                        <td>
                          <span
                            className={locDepts.length > 0 ? styles.clickableName : ''}
                            onClick={() => locDepts.length > 0 && toggleExpandLoc(loc.id)}
                          >
                            {loc.name}
                          </span>
                        </td>
                        <td>{loc.address}</td>
                        <td>{loc.city}, {loc.county}</td>
                        <td>{loc.phoneNumber ?? '—'}</td>
                        <td>
                          {loc.isPrimary && (
                            <span className={styles.badgePrimary}>Sediu principal</span>
                          )}
                        </td>
                        <td>
                          <span className={loc.isActive ? styles.badgeActive : styles.badgeInactive}>
                            {loc.isActive ? 'Activă' : 'Inactivă'}
                          </span>
                        </td>
                        <td>
                          <ActionButtons
                            onEdit={() => handleOpenEditLocation(loc)}
                            onDelete={() => setDeleteTarget(loc)}
                          />
                        </td>
                      </tr>

                      {/* ===== Detail row: departamente din locație ===== */}
                      {isExpanded && (
                        <tr key={`${loc.id}-detail`} className={styles.detailRow}>
                          <td colSpan={8} className={styles.detailCell}>
                            <div className={styles.detailContent}>
                              <div className={styles.detailHeader}>
                                <IconDepartment />
                                <span>Departamente în <strong>{loc.name}</strong></span>
                              </div>
                              {locDepts.length === 0 ? (
                                <p className={styles.detailEmpty}>Niciun departament asignat.</p>
                              ) : (
                                <div className={styles.deptList}>
                                  {locDepts.map((dept) => (
                                    <div
                                      key={dept.id}
                                      className={styles.deptCard}
                                    >
                                      <div className={styles.deptCardHeader}>
                                        <span className={styles.deptName}>{dept.name}</span>
                                        <span className={styles.deptCode}>{dept.code}</span>
                                      </div>
                                      {dept.headDoctorName && (
                                        <div className={styles.deptMeta}>
                                          <IconStar />
                                          <span>Șef: {dept.headDoctorName}</span>
                                        </div>
                                      )}
                                      <div className={styles.deptMeta}>
                                        <IconDoctor />
                                        <span>{dept.doctorCount} {dept.doctorCount === 1 ? 'medic' : 'medici'}</span>
                                      </div>
                                      <div className={styles.deptMeta}>
                                        <IconDoctor />
                                        <span>{dept.medicalStaffCount} personal medical</span>
                                      </div>
                                      <span className={dept.isActive ? styles.badgeActive : styles.badgeInactive}>
                                        {dept.isActive ? 'Activ' : 'Inactiv'}
                                      </span>
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

      {/* ===== Modal formular locație ===== */}
      <LocationFormModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        onSubmit={handleLocationSubmit}
        isLoading={createLocation.isPending || updateLocation.isPending}
        editData={editingLocation}
      />

      {/* ===== Dialog confirmare ștergere ===== */}
      {deleteTarget && (
        <div className={styles.confirmOverlay} onClick={() => setDeleteTarget(null)}>
          <div className={styles.confirmDialog} onClick={(e) => e.stopPropagation()}>
            <h5>Confirmare ștergere</h5>
            <p>
              Ești sigur că vrei să ștergi locația <strong>{deleteTarget.name}</strong>?
              Această acțiune nu poate fi anulată.
            </p>
            <div className={styles.confirmActions}>
              <AppButton
                variant="outline-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLocation.isPending}
              >
                Anulează
              </AppButton>
              <AppButton
                variant="danger"
                onClick={handleConfirmDelete}
                isLoading={deleteLocation.isPending}
                loadingText="Se șterge..."
              >
                Șterge
              </AppButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClinicPage
