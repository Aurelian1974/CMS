import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, updateUserSchema, type CreateUserFormData, type UpdateUserFormData } from '../../schemas/user.schema'
import type { UserDto, RoleDto, UserAssociationType } from '../../types/user.types'
import type { DoctorLookupDto } from '@/features/doctors/types/doctor.types'
import type { MedicalStaffLookupDto } from '@/features/medicalStaff/types/medicalStaff.types'
import styles from './UserFormModal.module.scss'

interface UserFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateUserFormData) => void
  isLoading: boolean
  /** Utilizator existent pentru editare, null pentru creare */
  editData: UserDto | null
  /** Lista roluri active */
  roles: RoleDto[]
  /** Lista doctori pentru dropdown */
  doctorLookup: DoctorLookupDto[]
  /** Lista personal medical pentru dropdown */
  staffLookup: MedicalStaffLookupDto[]
  /** Eroare server (ex: email duplicat) — afișată în modal */
  serverError?: string | null
}

export const UserFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
  roles,
  doctorLookup,
  staffLookup,
  serverError,
}: UserFormModalProps) => {
  const isEdit = !!editData

  // Folosim schema corespunzătoare modului
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(isEdit ? (updateUserSchema as typeof createUserSchema) : createUserSchema),
    defaultValues: {
      roleId: '',
      associationType: 'doctor' as UserAssociationType,
      doctorId: '',
      medicalStaffId: '',
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      isActive: true,
    },
  })

  const associationType = watch('associationType')
  const watchDoctorId = watch('doctorId')
  const watchStaffId = watch('medicalStaffId')

  // Populare formular la editare / reset la creare
  useEffect(() => {
    if (!isOpen) return

    if (editData) {
      const assocType: UserAssociationType = editData.doctorId ? 'doctor' : 'medicalStaff'
      reset({
        roleId: editData.roleId,
        associationType: assocType,
        doctorId: editData.doctorId ?? '',
        medicalStaffId: editData.medicalStaffId ?? '',
        username: editData.username ?? '',
        email: editData.email,
        password: '', // Nu se populează parola la editare
        confirmPassword: '',
        firstName: editData.firstName,
        lastName: editData.lastName,
        isActive: editData.isActive,
      })
    } else {
      reset({
        roleId: '',
        associationType: 'doctor',
        doctorId: '',
        medicalStaffId: '',
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        isActive: true,
      })
    }
  }, [isOpen, editData, reset])

  // Când se schimbă tipul asocierii, resetăm câmpul celălalt
  useEffect(() => {
    if (associationType === 'doctor') {
      setValue('medicalStaffId', '')
    } else {
      setValue('doctorId', '')
    }
  }, [associationType, setValue])

  // Auto-completare nume, prenume, email la selectare doctor
  useEffect(() => {
    if (!watchDoctorId || isEdit) return
    const doctor = doctorLookup.find(d => d.id === watchDoctorId)
    if (doctor) {
      setValue('firstName', doctor.firstName ?? '')
      setValue('lastName', doctor.lastName ?? '')
      setValue('email', doctor.email ?? '')
    }
  }, [watchDoctorId, doctorLookup, setValue, isEdit])

  // Auto-completare nume, prenume, email la selectare personal medical
  useEffect(() => {
    if (!watchStaffId || isEdit) return
    const staff = staffLookup.find(s => s.id === watchStaffId)
    if (staff) {
      setValue('firstName', staff.firstName ?? '')
      setValue('lastName', staff.lastName ?? '')
      setValue('email', staff.email ?? '')
    }
  }, [watchStaffId, staffLookup, setValue, isEdit])

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h5 className={styles.modalTitle}>
            {isEdit ? 'Editează Utilizator' : 'Utilizator Nou'}
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

            {/* Username + Email */}
            <div className="row g-3">
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Username <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control${errors.username ? ' is-invalid' : ''}`}
                    placeholder="ex: maria.popescu"
                    {...register('username')}
                  />
                  {errors.username && <span className={styles.error}>{errors.username.message}</span>}
                </div>
              </div>
              <div className="col-md-6">
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Email <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control${errors.email ? ' is-invalid' : ''}`}
                    placeholder="ex: utilizator@clinica.ro"
                    {...register('email')}
                  />
                  {errors.email && <span className={styles.error}>{errors.email.message}</span>}
                </div>
              </div>
            </div>

            {/* Parolă + Confirmă parola — doar la creare */}
            {!isEdit && (
              <div className="row g-3">
                <div className="col-md-6">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Parolă <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control${errors.password ? ' is-invalid' : ''}`}
                      placeholder="Minim 6 caractere"
                      {...register('password')}
                    />
                    {errors.password && <span className={styles.error}>{errors.password.message}</span>}
                  </div>
                </div>
                <div className="col-md-6">
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Confirmă parola <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="password"
                      className={`form-control${errors.confirmPassword ? ' is-invalid' : ''}`}
                      placeholder="Reintroduceți parola"
                      {...register('confirmPassword')}
                    />
                    {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword.message}</span>}
                  </div>
                </div>
              </div>
            )}

            {/* Rol */}
            <div className="row g-3">
              <div className="col-12">
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Rol <span className={styles.required}>*</span>
                  </label>
                  <select
                    className={`form-select${errors.roleId ? ' is-invalid' : ''}`}
                    {...register('roleId')}
                  >
                    <option value="">— Selectează rolul —</option>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                  {errors.roleId && <span className={styles.error}>{errors.roleId.message}</span>}
                </div>
              </div>
            </div>

            {/* Tip asociere — Doctor sau Personal medical */}
            <div className={styles.sectionDivider}>
              <span className={styles.sectionLabel}>Asociere cont</span>
            </div>

            <div className={styles.assocToggle}>
              <label className={`${styles.assocOption} ${associationType === 'doctor' ? styles['assocOption--selected'] : ''}`}>
                <input
                  type="radio"
                  value="doctor"
                  {...register('associationType')}
                  className={styles.radioHidden}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
                <span>Doctor</span>
              </label>
              <label className={`${styles.assocOption} ${associationType === 'medicalStaff' ? styles['assocOption--selected'] : ''}`}>
                <input
                  type="radio"
                  value="medicalStaff"
                  {...register('associationType')}
                  className={styles.radioHidden}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                <span>Personal medical</span>
              </label>
            </div>

            {/* Dropdown doctor SAU personal medical — condiționat de associationType */}
            <div className="row g-3">
              <div className="col-12">
                {associationType === 'doctor' ? (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Doctor asociat <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={`form-select${errors.doctorId ? ' is-invalid' : ''}`}
                      {...register('doctorId')}
                    >
                      <option value="">— Selectează doctorul —</option>
                      {doctorLookup.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.fullName}{d.medicalCode ? ` (${d.medicalCode})` : ''}{d.specialtyName ? ` — ${d.specialtyName}` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.doctorId && <span className={styles.error}>{errors.doctorId.message}</span>}
                  </div>
                ) : (
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Personal medical asociat <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={`form-select${errors.medicalStaffId ? ' is-invalid' : ''}`}
                      {...register('medicalStaffId')}
                    >
                      <option value="">— Selectează membrul —</option>
                      {staffLookup.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.fullName}{s.medicalTitleName ? ` — ${s.medicalTitleName}` : ''}
                        </option>
                      ))}
                    </select>
                    {errors.medicalStaffId && <span className={styles.error}>{errors.medicalStaffId.message}</span>}
                  </div>
                )}
              </div>
            </div>

            {/* Status activ (doar la editare) */}
            {isEdit && (
              <div className={styles.formGroup}>
                <div className="form-check form-switch">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="userIsActive"
                    {...register('isActive')}
                  />
                  <label className="form-check-label" htmlFor="userIsActive">
                    Cont activ
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
              {isLoading ? 'Se salvează...' : isEdit ? 'Salvează' : 'Creează cont'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
