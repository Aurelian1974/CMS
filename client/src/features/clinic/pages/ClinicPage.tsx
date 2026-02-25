import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { PageHeader } from '@/components/layout/PageHeader'
import { LocationFormModal } from '../components/LocationFormModal'
import { ActionButtons } from '@/components/data-display/ActionButtons'
import { IconPlus } from '@/components/ui/Icons'
import { clinicSchema, type ClinicFormData } from '../schemas/clinic.schema'
import type { ClinicLocationDto, ClinicLocationFormData } from '../types/clinic.types'
import {
  useCurrentClinic,
  useClinicLocations,
  useUpdateClinic,
  useCreateClinicLocation,
  useUpdateClinicLocation,
  useDeleteClinicLocation,
} from '../hooks/useClinic'
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

  // State mesaje feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  // Formular clinică
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
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
        caenCode: clinic.caenCode ?? '',
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

  const locations = locationsResp?.data ?? []
  const isLoading = loadingClinic || loadingLocations

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
    updateClinic.mutate(data, {
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
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Se încarcă...</span>
          </div>
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
            {/* Denumire societate */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Denumire societate <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`form-control${errors.name ? ' is-invalid' : ''}`}
                placeholder="ex: S.C. Clinica Medicală S.R.L."
                {...register('name')}
              />
              {errors.name && <span className={styles.error}>{errors.name.message}</span>}
            </div>

            {/* CUI/CIF */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                CUI / CIF <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`form-control${errors.fiscalCode ? ' is-invalid' : ''}`}
                placeholder="ex: RO12345678"
                {...register('fiscalCode')}
              />
              {errors.fiscalCode && <span className={styles.error}>{errors.fiscalCode.message}</span>}
            </div>

            {/* Nr. Reg. Comerțului */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Nr. Registrul Comerțului</label>
              <input
                type="text"
                className={`form-control${errors.tradeRegisterNumber ? ' is-invalid' : ''}`}
                placeholder="ex: J40/1234/2020"
                {...register('tradeRegisterNumber')}
              />
              {errors.tradeRegisterNumber && <span className={styles.error}>{errors.tradeRegisterNumber.message}</span>}
            </div>

            {/* Cod CAEN */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Cod CAEN</label>
              <input
                type="text"
                className={`form-control${errors.caenCode ? ' is-invalid' : ''}`}
                placeholder="ex: 8621"
                {...register('caenCode')}
              />
              {errors.caenCode && <span className={styles.error}>{errors.caenCode.message}</span>}
            </div>

            {/* Reprezentant legal */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Reprezentant legal</label>
              <input
                type="text"
                className={`form-control${errors.legalRepresentative ? ' is-invalid' : ''}`}
                placeholder="ex: Dr. Popescu Ion"
                {...register('legalRepresentative')}
              />
              {errors.legalRepresentative && <span className={styles.error}>{errors.legalRepresentative.message}</span>}
            </div>

            {/* Contract CNAS */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Nr. contract CNAS</label>
              <input
                type="text"
                className={`form-control${errors.contractCNAS ? ' is-invalid' : ''}`}
                placeholder="ex: 12345/2024"
                {...register('contractCNAS')}
              />
              {errors.contractCNAS && <span className={styles.error}>{errors.contractCNAS.message}</span>}
            </div>

            {/* Separator vizual — Sediu social */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <hr className="my-1" />
              <label className={styles.label} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Sediu social
              </label>
            </div>

            {/* Adresă sediu social */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>
                Adresă <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`form-control${errors.address ? ' is-invalid' : ''}`}
                placeholder="ex: Str. Sănătății nr. 10, Sector 1"
                {...register('address')}
              />
              {errors.address && <span className={styles.error}>{errors.address.message}</span>}
            </div>

            {/* Oraș */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Oraș <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`form-control${errors.city ? ' is-invalid' : ''}`}
                placeholder="ex: București"
                {...register('city')}
              />
              {errors.city && <span className={styles.error}>{errors.city.message}</span>}
            </div>

            {/* Județ */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Județ <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`form-control${errors.county ? ' is-invalid' : ''}`}
                placeholder="ex: București"
                {...register('county')}
              />
              {errors.county && <span className={styles.error}>{errors.county.message}</span>}
            </div>

            {/* Cod poștal */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Cod poștal</label>
              <input
                type="text"
                className={`form-control${errors.postalCode ? ' is-invalid' : ''}`}
                placeholder="ex: 010100"
                {...register('postalCode')}
              />
              {errors.postalCode && <span className={styles.error}>{errors.postalCode.message}</span>}
            </div>

            {/* Separator vizual — Date bancare */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <hr className="my-1" />
              <label className={styles.label} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Date bancare
              </label>
            </div>

            {/* Bancă */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Banca</label>
              <input
                type="text"
                className={`form-control${errors.bankName ? ' is-invalid' : ''}`}
                placeholder="ex: Banca Transilvania"
                {...register('bankName')}
              />
              {errors.bankName && <span className={styles.error}>{errors.bankName.message}</span>}
            </div>

            {/* IBAN */}
            <div className={`${styles.formGroup}`} style={{ gridColumn: 'span 2' }}>
              <label className={styles.label}>Cont IBAN</label>
              <input
                type="text"
                className={`form-control${errors.bankAccount ? ' is-invalid' : ''}`}
                placeholder="ex: RO49AAAA1B31007593840000"
                {...register('bankAccount')}
              />
              {errors.bankAccount && <span className={styles.error}>{errors.bankAccount.message}</span>}
            </div>

            {/* Separator vizual — Contact */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <hr className="my-1" />
              <label className={styles.label} style={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Date de contact
              </label>
            </div>

            {/* Email */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Email</label>
              <input
                type="email"
                className={`form-control${errors.email ? ' is-invalid' : ''}`}
                placeholder="ex: contact@clinica.ro"
                {...register('email')}
              />
              {errors.email && <span className={styles.error}>{errors.email.message}</span>}
            </div>

            {/* Telefon */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Telefon</label>
              <input
                type="text"
                className={`form-control${errors.phoneNumber ? ' is-invalid' : ''}`}
                placeholder="ex: 021 123 4567"
                {...register('phoneNumber')}
              />
              {errors.phoneNumber && <span className={styles.error}>{errors.phoneNumber.message}</span>}
            </div>

            {/* Website */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Website</label>
              <input
                type="text"
                className={`form-control${errors.website ? ' is-invalid' : ''}`}
                placeholder="ex: www.clinica.ro"
                {...register('website')}
              />
              {errors.website && <span className={styles.error}>{errors.website.message}</span>}
            </div>
          </div>

          {/* Buton salvare */}
          <div className={styles.formActions}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isDirty || updateClinic.isPending}
            >
              {updateClinic.isPending ? 'Se salvează...' : 'Salvează modificările'}
            </button>
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
          <button className="btn btn-primary btn-sm" onClick={handleOpenCreateLocation}>
            <IconPlus /> Adaugă locație
          </button>
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
                {locations.map((loc) => (
                  <tr key={loc.id}>
                    <td>{loc.name}</td>
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
                ))}
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
              <button
                className="btn btn-outline-secondary"
                onClick={() => setDeleteTarget(null)}
                disabled={deleteLocation.isPending}
              >
                Anulează
              </button>
              <button
                className="btn btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleteLocation.isPending}
              >
                {deleteLocation.isPending ? 'Se șterge...' : 'Șterge'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClinicPage
