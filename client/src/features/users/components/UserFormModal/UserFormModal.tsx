import { useEffect, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { buildCreateUserSchema, updateUserSchema, describePasswordPolicy, ASSOCIATION_FIELD, type CreateUserFormData } from '../../schemas/user.schema'
import type { UserDto, RoleDto, UserAssociationType, PasswordPolicyDto } from '../../types/user.types'
import type { DoctorLookupDto } from '@/features/doctors/types/doctor.types'
import type { MedicalStaffLookupDto } from '@/features/medicalStaff/types/medicalStaff.types'
import type { AdministrativeStaffLookupDto } from '@/features/administrativeStaff/types/administrativeStaff.types'
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
  /** Lista personal administrativ pentru dropdown */
  adminStaffLookup: AdministrativeStaffLookupDto[]
  /** Politica de parole din Setări securitate (undefined cât se încarcă) */
  passwordPolicy?: PasswordPolicyDto
  /** Eroare server (ex: email duplicat) — afișată în modal */
  serverError?: string | null
}

const EMPTY_FORM: CreateUserFormData = {
  roleId: '',
  associationType: 'doctor',
  doctorId: '',
  medicalStaffId: '',
  administrativeStaffId: '',
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  isActive: true,
}

const associationOf = (user: UserDto): UserAssociationType =>
  user.doctorId ? 'doctor' : user.medicalStaffId ? 'medicalStaff' : 'administrativeStaff'

export const UserFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
  roles,
  doctorLookup,
  staffLookup,
  adminStaffLookup,
  passwordPolicy,
  serverError,
}: UserFormModalProps) => {
  const isEdit = !!editData

  const createSchema = useMemo(() => buildCreateUserSchema(passwordPolicy), [passwordPolicy])

  // Folosim schema corespunzătoare modului
  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(isEdit ? (updateUserSchema as unknown as typeof createSchema) : createSchema),
    defaultValues: EMPTY_FORM,
  })

  const associationType = useWatch({ control, name: 'associationType', defaultValue: 'doctor' })
  const watchDoctorId = useWatch({ control, name: 'doctorId', defaultValue: '' })
  const watchStaffId = useWatch({ control, name: 'medicalStaffId', defaultValue: '' })
  const watchAdminStaffId = useWatch({ control, name: 'administrativeStaffId', defaultValue: '' })

  // Populare formular la editare / reset la creare
  useEffect(() => {
    if (!isOpen) return

    if (editData) {
      reset({
        roleId: editData.roleId,
        associationType: associationOf(editData),
        doctorId: editData.doctorId ?? '',
        medicalStaffId: editData.medicalStaffId ?? '',
        administrativeStaffId: editData.administrativeStaffId ?? '',
        username: editData.username ?? '',
        email: editData.email,
        password: '', // Nu se populează parola la editare
        confirmPassword: '',
        firstName: editData.firstName,
        lastName: editData.lastName,
        isActive: editData.isActive,
      })
    } else {
      reset(EMPTY_FORM)
    }
  }, [isOpen, editData, reset])

  // Când se schimbă tipul asocierii, golește celelalte câmpuri de asociere
  useEffect(() => {
    for (const type of Object.keys(ASSOCIATION_FIELD) as UserAssociationType[]) {
      if (type !== associationType) setValue(ASSOCIATION_FIELD[type], '')
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

  // Auto-completare nume, prenume, email la selectare personal administrativ
  useEffect(() => {
    if (!watchAdminStaffId || isEdit) return
    const staff = adminStaffLookup.find(s => s.id === watchAdminStaffId)
    if (staff) {
      setValue('firstName', staff.firstName ?? '')
      setValue('lastName', staff.lastName ?? '')
      setValue('email', staff.email ?? '')
    }
  }, [watchAdminStaffId, adminStaffLookup, setValue, isEdit])

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
                    placeholder={passwordPolicy ? `Minim ${passwordPolicy.minLength} caractere` : 'Parolă'}
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
                {passwordPolicy && (
                  <div className="col-12">
                    <p className={styles.passwordHint}>{describePasswordPolicy(passwordPolicy, true)}</p>
                  </div>
                )}
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

            {/* Tip asociere — Doctor, Personal medical sau Personal administrativ */}
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
              <label className={`${styles.assocOption} ${associationType === 'administrativeStaff' ? styles['assocOption--selected'] : ''}`}>
                <input
                  type="radio"
                  value="administrativeStaff"
                  {...register('associationType')}
                  className={styles.radioHidden}
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></svg>
                <span>Personal administrativ</span>
              </label>
            </div>

            {/* Dropdown persoană asociată — condiționat de associationType */}
            <div className="row g-3">
              <div className="col-12">
                {associationType === 'doctor' && (
                  <FormSelect<CreateUserFormData>
                    name="doctorId"
                    control={control}
                    label="Doctor asociat"
                    options={doctorLookup.map(d => ({ value: d.id, label: `${d.fullName}${d.medicalCode ? ` (${d.medicalCode})` : ''}${d.specialtyName ? ` — ${d.specialtyName}` : ''}` }))}
                    required
                    allowFiltering
                    showClearButton
                  />
                )}
                {associationType === 'medicalStaff' && (
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
                {associationType === 'administrativeStaff' && (
                  <FormSelect<CreateUserFormData>
                    name="administrativeStaffId"
                    control={control}
                    label="Personal administrativ asociat"
                    options={adminStaffLookup.map(s => ({ value: s.id, label: `${s.fullName}${s.positionName ? ` — ${s.positionName}` : ''}` }))}
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
