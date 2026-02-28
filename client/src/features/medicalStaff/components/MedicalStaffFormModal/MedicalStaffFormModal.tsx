import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { medicalStaffSchema, type MedicalStaffFormData } from '../../schemas/medicalStaff.schema'
import type { MedicalStaffDto } from '../../types/medicalStaff.types'
import type { DoctorLookupDto } from '@/features/doctors/types/doctor.types'
import type { MedicalTitleDto } from '@/features/nomenclature/types/medicalTitle.types'
import type { DepartmentDto } from '@/features/departments/types/department.types'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { AppButton } from '@/components/ui/AppButton'
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
    control,
    register,
    handleSubmit,
    reset,
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

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={680}
      title={isEdit ? 'Editează Personal Medical' : 'Personal Medical Nou'}
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
            {isEdit ? 'Salvează' : 'Adaugă'}
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
                <FormInput<MedicalStaffFormData>
                  name="lastName"
                  control={control}
                  label="Nume"
                  placeholder="ex: Popescu"
                  required
                />
              </div>
              <div className="col-md-6">
                <FormInput<MedicalStaffFormData>
                  name="firstName"
                  control={control}
                  label="Prenume"
                  placeholder="ex: Maria"
                  required
                />
              </div>
            </div>

            {/* Email + Telefon */}
            <div className="row g-3">
              <div className="col-md-6">
                <FormInput<MedicalStaffFormData>
                  name="email"
                  control={control}
                  label="Email"
                  type="email"
                  placeholder="ex: asistent@clinica.ro"
                  required
                />
              </div>
              <div className="col-md-6">
                <FormInput<MedicalStaffFormData>
                  name="phoneNumber"
                  control={control}
                  label="Telefon"
                  placeholder="ex: 0721 234 567"
                />
              </div>
            </div>

            {/* Titulatură + Departament + Supervisor */}
            <div className="row g-3">
              <div className="col-md-4">
                <FormSelect<MedicalStaffFormData>
                  name="medicalTitleId"
                  control={control}
                  label="Titulatură"
                  options={staffTitles.map(t => ({ value: t.id, label: t.name }))}
                  showClearButton
                />
              </div>
              <div className="col-md-4">
                <FormSelect<MedicalStaffFormData>
                  name="departmentId"
                  control={control}
                  label="Departament"
                  options={departments.map(d => ({ value: d.id, label: d.name }))}
                  showClearButton
                />
              </div>
              <div className="col-md-4">
                <FormSelect<MedicalStaffFormData>
                  name="supervisorDoctorId"
                  control={control}
                  label="Doctor supervizor"
                  options={doctorLookup.map(d => ({ value: d.id, label: `${d.fullName}${d.medicalCode ? ` (${d.medicalCode})` : ''}` }))}
                  showClearButton
                  allowFiltering
                />
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
    </AppModal>
  )
}
