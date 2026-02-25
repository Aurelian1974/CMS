import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { medicalStaffSchema, type MedicalStaffFormData } from '../../schemas/medicalStaff.schema'
import type { MedicalStaffDto } from '../../types/medicalStaff.types'
import type { DoctorLookupDto } from '@/features/doctors/types/doctor.types'
import type { MedicalTitleDto } from '@/features/nomenclature/types/medicalTitle.types'
import type { DepartmentDto } from '@/features/departments/types/department.types'
import styles from './MedicalStaffFormModal.module.scss'

interface MedicalStaffFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MedicalStaffFormData) => void
  isLoading: boolean
  /** Membru existent pentru editare, null pentru creare */
  editData: MedicalStaffDto | null
  /** Lista departamente disponibile */
  departments: DepartmentDto[]
  /** Lista doctori pentru dropdown supervisor */
  doctorLookup: DoctorLookupDto[]
  /** Lista titulaturi medicale (toate — filtrarea se face intern) */
  medicalTitles: MedicalTitleDto[]
  /** Eroare server (ex: email duplicat) — afișată în modal */
  serverError?: string | null
}

export const MedicalStaffFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
  departments,
  doctorLookup,
  medicalTitles,
  serverError,
}: MedicalStaffFormModalProps) => {
  const isEdit = !!editData

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MedicalStaffFormData>({
    resolver: zodResolver(medicalStaffSchema),
    defaultValues: {
      departmentId: '',
      supervisorDoctorId: '',
      medicalTitleId: '',
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      isActive: true,
    },
  })

  // Titulaturi filtrate — doar cele NON-medic (asistenți, infirmieri, moașe etc.)
  const staffTitles = useMemo(
    () => medicalTitles.filter(t => t.isActive && !t.code.startsWith('MEDIC')),
    [medicalTitles],
  )

  // Populare formular la editare / reset la creare
  useEffect(() => {
    if (!isOpen) return

    if (editData) {
      reset({
        departmentId: editData.departmentId ?? '',
        supervisorDoctorId: editData.supervisorDoctorId ?? '',
        medicalTitleId: editData.medicalTitleId ?? '',
        firstName: editData.firstName,
        lastName: editData.lastName,
        email: editData.email,
        phoneNumber: editData.phoneNumber ?? '',
        isActive: editData.isActive,
      })
    } else {
      reset({
        departmentId: '',
        supervisorDoctorId: '',
        medicalTitleId: '',
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
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
            {isEdit ? 'Editează Personal Medical' : 'Personal Medical Nou'}
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
                    placeholder="ex: Maria"
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
                    placeholder="ex: asistent@clinica.ro"
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

            {/* Titulatură + Departament + Supervisor */}
            <div className="row g-3">
              <div className="col-md-4">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Titulatură</label>
                  <select
                    className={`form-select${errors.medicalTitleId ? ' is-invalid' : ''}`}
                    {...register('medicalTitleId')}
                  >
                    <option value="">— Selectează titulatura —</option>
                    {staffTitles.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  {errors.medicalTitleId && <span className={styles.error}>{errors.medicalTitleId.message}</span>}
                </div>
              </div>
              <div className="col-md-4">
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
              <div className="col-md-4">
                <div className={styles.formGroup}>
                  <label className={styles.label}>Doctor supervizor</label>
                  <select
                    className={`form-select${errors.supervisorDoctorId ? ' is-invalid' : ''}`}
                    {...register('supervisorDoctorId')}
                  >
                    <option value="">— Fără supervizor —</option>
                    {doctorLookup.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.fullName}{d.medicalCode ? ` (${d.medicalCode})` : ''}
                      </option>
                    ))}
                  </select>
                  {errors.supervisorDoctorId && <span className={styles.error}>{errors.supervisorDoctorId.message}</span>}
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
                    id="staffIsActive"
                    {...register('isActive')}
                  />
                  <label className="form-check-label" htmlFor="staffIsActive">
                    Angajat activ
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
