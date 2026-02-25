import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { doctorSchema, type DoctorFormData } from '../../schemas/doctor.schema'
import type { DoctorDto } from '../../types/doctor.types'
import type { DoctorLookupDto } from '../../types/doctor.types'
import type { SpecialtyDto } from '@/features/nomenclature/types/specialty.types'
import type { DepartmentDto } from '@/features/departments/types/department.types'
import styles from './DoctorFormModal.module.scss'

interface DoctorFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: DoctorFormData) => void
  isLoading: boolean
  /** Doctor existent pentru editare, null pentru creare */
  editData: DoctorDto | null
  /** Lista flat specializări (toate nivelurile) */
  specialties: SpecialtyDto[]
  /** Lista departamente disponibile */
  departments: DepartmentDto[]
  /** Lista doctori pentru dropdown supervisor */
  doctorLookup: DoctorLookupDto[]
  /** Eroare server (ex: email duplicat) — afișată în modal */
  serverError?: string | null
}

export const DoctorFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
  specialties,
  departments,
  doctorLookup,
  serverError,
}: DoctorFormModalProps) => {
  const isEdit = !!editData

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      departmentId: '',
      supervisorDoctorId: '',
      specialtyId: '',
      subspecialtyId: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      medicalCode: '',
      licenseNumber: '',
      licenseExpiresAt: '',
      isActive: true,
    },
  })

  // Urmărim specialitatea selectată pentru dropdown cascadat
  const selectedSpecialtyId = watch('specialtyId')

  // Specializări nivel 1 (specialty)
  const level1Specialties = useMemo(
    () => specialties.filter(s => s.level === 1 && s.isActive),
    [specialties],
  )

  // Subspecializări (nivel 2) filtrate după specializarea selectată
  const filteredSubspecialties = useMemo(
    () =>
      selectedSpecialtyId
        ? specialties.filter(s => s.level === 2 && s.parentId === selectedSpecialtyId && s.isActive)
        : [],
    [specialties, selectedSpecialtyId],
  )

  // Doctori supervisor (excludem doctorul curent la editare)
  const supervisorOptions = useMemo(
    () => editData
      ? doctorLookup.filter(d => d.id !== editData.id)
      : doctorLookup,
    [doctorLookup, editData],
  )

  // Reset subspecializare când se schimbă specializarea
  useEffect(() => {
    // La editare, dacă subspecialitatea existentă e child-ul specializării selectate, nu o reseta
    if (editData && editData.specialtyId === selectedSpecialtyId && editData.subspecialtyId) {
      return
    }
    setValue('subspecialtyId', '')
  }, [selectedSpecialtyId, setValue, editData])

  // Populare formular la editare / reset la creare
  useEffect(() => {
    if (!isOpen) return

    if (editData) {
      reset({
        departmentId: editData.departmentId ?? '',
        supervisorDoctorId: editData.supervisorDoctorId ?? '',
        specialtyId: editData.specialtyId ?? '',
        subspecialtyId: editData.subspecialtyId ?? '',
        firstName: editData.firstName,
        lastName: editData.lastName,
        email: editData.email,
        phoneNumber: editData.phoneNumber ?? '',
        medicalCode: editData.medicalCode ?? '',
        licenseNumber: editData.licenseNumber ?? '',
        licenseExpiresAt: editData.licenseExpiresAt
          ? editData.licenseExpiresAt.slice(0, 10)
          : '',
        isActive: editData.isActive,
      })
    } else {
      reset({
        departmentId: '',
        supervisorDoctorId: '',
        specialtyId: '',
        subspecialtyId: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        medicalCode: '',
        licenseNumber: '',
        licenseExpiresAt: '',
        isActive: true,
      })
    }
  }, [isOpen, editData, reset])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h5 className={styles.modalTitle}>
            {isEdit ? 'Editează Doctor' : 'Doctor Nou'}
          </h5>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Închide">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.modalBody}>

            {/* Eroare server */}
            {serverError && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                {serverError}
              </div>
            )}

            {/* Nume + Prenume */}
            <div className="row g-3">
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Nume <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control${errors.lastName ? ' is-invalid' : ''}`}
                    placeholder="ex: Popescu"
                    {...register('lastName')}
                  />
                  {errors.lastName && <span className={styles.error}>{errors.lastName.message}</span>}
                </div>
              </div>
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Prenume <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control${errors.firstName ? ' is-invalid' : ''}`}
                    placeholder="ex: Ion"
                    {...register('firstName')}
                  />
                  {errors.firstName && <span className={styles.error}>{errors.firstName.message}</span>}
                </div>
              </div>
            </div>

            {/* Email + Telefon */}
            <div className="row g-3">
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Email <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control${errors.email ? ' is-invalid' : ''}`}
                    placeholder="ex: doctor@clinica.ro"
                    {...register('email')}
                  />
                  {errors.email && <span className={styles.error}>{errors.email.message}</span>}
                </div>
              </div>
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Telefon</label>
                  <input
                    type="text"
                    className={`form-control${errors.phoneNumber ? ' is-invalid' : ''}`}
                    placeholder="ex: 0721 234 567"
                    {...register('phoneNumber')}
                  />
                  {errors.phoneNumber && <span className={styles.error}>{errors.phoneNumber.message}</span>}
                </div>
              </div>
            </div>

            {/* Specializare + Subspecializare (dropdown cascadat) */}
            <div className="row g-3">
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Specializare</label>
                  <select
                    className={`form-select${errors.specialtyId ? ' is-invalid' : ''}`}
                    {...register('specialtyId')}
                  >
                    <option value="">— Selectează specializarea —</option>
                    {level1Specialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.specialtyId && <span className={styles.error}>{errors.specialtyId.message}</span>}
                </div>
              </div>
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Subspecializare</label>
                  <select
                    className={`form-select${errors.subspecialtyId ? ' is-invalid' : ''}`}
                    disabled={!selectedSpecialtyId || filteredSubspecialties.length === 0}
                    {...register('subspecialtyId')}
                  >
                    <option value="">
                      {!selectedSpecialtyId
                        ? '— Selectează mai întâi specializarea —'
                        : filteredSubspecialties.length === 0
                          ? '— Nicio subspecializare —'
                          : '— Selectează subspecializarea —'}
                    </option>
                    {filteredSubspecialties.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                  {errors.subspecialtyId && <span className={styles.error}>{errors.subspecialtyId.message}</span>}
                </div>
              </div>
            </div>

            {/* Departament + Supervisor */}
            <div className="row g-3">
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Departament</label>
                  <select
                    className={`form-select${errors.departmentId ? ' is-invalid' : ''}`}
                    {...register('departmentId')}
                  >
                    <option value="">— Fără departament —</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {errors.departmentId && <span className={styles.error}>{errors.departmentId.message}</span>}
                </div>
              </div>
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Șef ierarhic</label>
                  <select
                    className={`form-select${errors.supervisorDoctorId ? ' is-invalid' : ''}`}
                    {...register('supervisorDoctorId')}
                  >
                    <option value="">— Fără superior ierarhic —</option>
                    {supervisorOptions.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.fullName}{d.medicalCode ? ` (${d.medicalCode})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.supervisorDoctorId && <span className={styles.error}>{errors.supervisorDoctorId.message}</span>}
                </div>
              </div>
            </div>

            {/* Parafă + Nr. CMR */}
            <div className="row g-3">
              <div className="col-md-4">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Parafă medicală</label>
                  <input
                    type="text"
                    className={`form-control${errors.medicalCode ? ' is-invalid' : ''}`}
                    placeholder="ex: 123456"
                    {...register('medicalCode')}
                  />
                  {errors.medicalCode && <span className={styles.error}>{errors.medicalCode.message}</span>}
                </div>
              </div>
              <div className="col-md-4">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Nr. CMR</label>
                  <input
                    type="text"
                    className={`form-control${errors.licenseNumber ? ' is-invalid' : ''}`}
                    placeholder="ex: BC-12345"
                    {...register('licenseNumber')}
                  />
                  {errors.licenseNumber && <span className={styles.error}>{errors.licenseNumber.message}</span>}
                </div>
              </div>
              <div className="col-md-4">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Aviz CMR expiră</label>
                  <input
                    type="date"
                    className={`form-control${errors.licenseExpiresAt ? ' is-invalid' : ''}`}
                    {...register('licenseExpiresAt')}
                  />
                  {errors.licenseExpiresAt && <span className={styles.error}>{errors.licenseExpiresAt.message}</span>}
                </div>
              </div>
            </div>

            {/* Status activ (doar la editare) */}
            {isEdit && (
              <div className={styles.formGroup}>
                <div className="form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="doctorIsActive"
                    {...register('isActive')}
                  />
                  <label className="form-check-label" htmlFor="doctorIsActive">
                    Doctor activ
                  </label>
                </div>
              </div>
            )}
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Anulează
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Se salvează...' : isEdit ? 'Salvează' : 'Adaugă'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
