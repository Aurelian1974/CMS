import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createUserSchema, updateUserSchema, type CreateUserFormData, type UpdateUserFormData } from '../../schemas/user.schema'
import type { UserDto, RoleDto, UserAssociationType } from '../../types/user.types'
import type { DoctorLookupDto } from '@/features/doctors/types/doctor.types'
import type { MedicalStaffLookupDto } from '@/features/medicalStaff/types/medicalStaff.types'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { AppButton } from '@/components/ui/AppButton'
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
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
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

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={680}
      title={isEdit ? 'Editează Utilizator' : 'Utilizator Nou'}
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      bodyClassName={styles.body}
      footer={
        <>
          <AppButton
            variant="outline-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Anulează
          </AppButton>
          <AppButton
            type="submit"
            variant="primary"
            isLoading={isLoading}
            loadingText="Se salvează..."
          >
            {isEdit ? 'Salvează' : 'Creează cont'}
          </AppButton>
        </>
      }
    >

            {/* Eroare server */}
            {serverError && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                {serverError}
              </div>
            )}

            {/* Nume + Prenume */}
            <div className="row g-3">
              <div className="col-md-6">
                <FormInput<CreateUserFormData>
                  name="lastName"
                  control={control}
                  label="Nume"
                  placeholder="ex: Popescu"
                  required
                />
              </div>
              <div className="col-md-6">
                <FormInput<CreateUserFormData>
                  name="firstName"
                  control={control}
                  label="Prenume"
                  placeholder="ex: Maria"
                  required
                />
              </div>
            </div>

            {/* Username + Email */}
            <div className="row g-3">
              <div className="col-md-6">
                <FormInput<CreateUserFormData>
                  name="username"
                  control={control}
                  label="Username"
                  placeholder="ex: maria.popescu"
                  required
                />
              </div>
              <div className="col-md-6">
                <FormInput<CreateUserFormData>
                  name="email"
                  control={control}
                  label="Email"
                  type="email"
                  placeholder="ex: utilizator@clinica.ro"
                  required
                />
              </div>
            </div>

            {/* Parolă + Confirmă parola — doar la creare */}
            {!isEdit && (
              <div className="row g-3">
                <div className="col-md-6">
                  <FormInput<CreateUserFormData>
                    name="password"
                    control={control}
                    label="Parolă"
                    type="password"
                    placeholder="Minim 6 caractere"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <FormInput<CreateUserFormData>
                    name="confirmPassword"
                    control={control}
                    label="Confirmă parola"
                    type="password"
                    placeholder="Reintroduceți parola"
                    required
                  />
                </div>
              </div>
            )}

            {/* Rol */}
            <div className="row g-3">
              <div className="col-12">
                <FormSelect<CreateUserFormData>
                  name="roleId"
                  control={control}
                  label="Rol"
                  options={roles.map(r => ({ value: r.id, label: r.name }))}
                  required
                />
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
                  <FormSelect<CreateUserFormData>
                    name="doctorId"
                    control={control}
                    label="Doctor asociat"
                    options={doctorLookup.map(d => ({ value: d.id, label: `${d.fullName}${d.medicalCode ? ` (${d.medicalCode})` : ''}${d.specialtyName ? ` — ${d.specialtyName}` : ''}` }))}
                    required
                    allowFiltering
                    showClearButton
                  />
                ) : (
                  <FormSelect<CreateUserFormData>
                    name="medicalStaffId"
                    control={control}
                    label="Personal medical asociat"
                    options={staffLookup.map(s => ({ value: s.id, label: `${s.fullName}${s.medicalTitleName ? ` — ${s.medicalTitleName}` : ''}` }))}
                    required
                    allowFiltering
                    showClearButton
                  />
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
    </AppModal>
  )
}
