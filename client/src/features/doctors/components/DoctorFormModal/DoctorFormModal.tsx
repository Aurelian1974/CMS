import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { doctorSchema, type DoctorFormData } from '../../schemas/doctor.schema'
import type { DoctorDto } from '../../types/doctor.types'
import type { DoctorLookupDto } from '../../types/doctor.types'
import type { SpecialtyDto } from '@/features/nomenclature/types/specialty.types'
import type { MedicalTitleDto } from '@/features/nomenclature/types/medicalTitle.types'
import type { DepartmentDto } from '@/features/departments/types/department.types'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { FormDatePicker } from '@/components/forms/FormDatePicker'
import { AppButton } from '@/components/ui/AppButton'
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
  /** Lista titulaturi medicale (toate — filtrarea se face intern) */
  medicalTitles: MedicalTitleDto[]
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
  medicalTitles,
  serverError,
}: DoctorFormModalProps) => {
  const isEdit = !!editData

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
  } = useForm<DoctorFormData>({
    resolver: zodResolver(doctorSchema),
    defaultValues: {
      departmentId: '',
      supervisorDoctorId: '',
      specialtyId: '',
      subspecialtyId: '',
      medicalTitleId: '',
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

  // Titulaturi filtrate — doar cele de tip medic (cod începe cu MEDIC)
  const doctorTitles = useMemo(
    () => medicalTitles.filter(t => t.isActive && t.code.startsWith('MEDIC')),
    [medicalTitles],
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
        medicalTitleId: editData.medicalTitleId ?? '',
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
        medicalTitleId: '',
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

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={680}
      title={isEdit ? 'Editează Doctor' : 'Doctor Nou'}
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
                <FormInput<DoctorFormData>
                  name="lastName"
                  control={control}
                  label="Nume"
                  placeholder="ex: Popescu"
                  required
                />
              </div>
              <div className="col-md-6">
                <FormInput<DoctorFormData>
                  name="firstName"
                  control={control}
                  label="Prenume"
                  placeholder="ex: Ion"
                  required
                />
              </div>
            </div>

            {/* Email + Telefon */}
            <div className="row g-3">
              <div className="col-md-6">
                <FormInput<DoctorFormData>
                  name="email"
                  control={control}
                  label="Email"
                  type="email"
                  placeholder="ex: doctor@clinica.ro"
                  required
                />
              </div>
              <div className="col-md-6">
                <FormInput<DoctorFormData>
                  name="phoneNumber"
                  control={control}
                  label="Telefon"
                  placeholder="ex: 0721 234 567"
                />
              </div>
            </div>

            {/* Specializare + Subspecializare (dropdown cascadat) */}
            <div className="row g-3">
              <div className="col-md-6">
                <FormSelect<DoctorFormData>
                  name="specialtyId"
                  control={control}
                  label="Specializare"
                  options={level1Specialties.map(s => ({ value: s.id, label: s.name }))}
                  showClearButton
                  allowFiltering
                />
              </div>
              <div className="col-md-6">
                <FormSelect<DoctorFormData>
                  name="subspecialtyId"
                  control={control}
                  label="Subspecializare"
                  options={filteredSubspecialties.map(s => ({ value: s.id, label: s.name }))}
                  disabled={!selectedSpecialtyId || filteredSubspecialties.length === 0}
                  placeholder={
                    !selectedSpecialtyId
                      ? 'Selectează mai întâi specializarea'
                      : filteredSubspecialties.length === 0
                        ? 'Nicio subspecializare'
                        : 'Selectează...'
                  }
                  showClearButton
                />
              </div>
            </div>

            {/* Titulatură + Departament + Supervisor */}
            <div className="row g-3">
              <div className="col-md-4">
                <FormSelect<DoctorFormData>
                  name="medicalTitleId"
                  control={control}
                  label="Titulatură"
                  options={doctorTitles.map(t => ({ value: t.id, label: t.name }))}
                  showClearButton
                />
              </div>
              <div className="col-md-4">
                <FormSelect<DoctorFormData>
                  name="departmentId"
                  control={control}
                  label="Departament"
                  options={departments.map(d => ({ value: d.id, label: d.name }))}
                  showClearButton
                />
              </div>
              <div className="col-md-4">
                <FormSelect<DoctorFormData>
                  name="supervisorDoctorId"
                  control={control}
                  label="Șef ierarhic"
                  options={supervisorOptions.map(d => ({ value: d.id, label: `${d.fullName}${d.medicalCode ? ` (${d.medicalCode})` : ''}` }))}
                  showClearButton
                  allowFiltering
                />
              </div>
            </div>

            {/* Parafă + Nr. CMR + Aviz CMR */}
            <div className="row g-3">
              <div className="col-md-4">
                <FormInput<DoctorFormData>
                  name="medicalCode"
                  control={control}
                  label="Parafă medicală"
                  placeholder="ex: 123456"
                />
              </div>
              <div className="col-md-4">
                <FormInput<DoctorFormData>
                  name="licenseNumber"
                  control={control}
                  label="Nr. CMR"
                  placeholder="ex: BC-12345"
                />
              </div>
              <div className="col-md-4">
                <FormDatePicker<DoctorFormData>
                  name="licenseExpiresAt"
                  control={control}
                  label="Aviz CMR expiră"
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
                    id="doctorIsActive"
                    {...register('isActive')}
                  />
                  <label className="form-check-label" htmlFor="doctorIsActive">
                    Doctor activ
                  </label>
                </div>
              </div>
            )}
    </AppModal>
  )
}
