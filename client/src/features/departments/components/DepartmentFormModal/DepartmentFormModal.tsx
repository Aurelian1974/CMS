import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { departmentSchema, type DepartmentFormData } from '../../schemas/department.schema'
import type { DepartmentDto } from '../../types/department.types'
import type { ClinicLocationDto } from '@/features/clinic/types/clinic.types'
import type { DoctorLookupDto } from '@/features/doctors/types/doctor.types'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { AppButton } from '@/components/ui/AppButton'
import styles from './DepartmentFormModal.module.scss'

interface DepartmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: DepartmentFormData) => void
  isLoading: boolean
  /** Departamentul existent pentru editare, null pentru creare */
  editData: DepartmentDto | null
  /** Lista locațiilor disponibile */
  locations: ClinicLocationDto[]
  /** Lista doctorilor pentru selectare șef departament */
  doctors: DoctorLookupDto[]
}

export const DepartmentFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
  locations,
  doctors,
}: DepartmentFormModalProps) => {
  const isEdit = !!editData

  const {
    control,
    register,
    handleSubmit,
    reset,
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(departmentSchema),
    defaultValues: {
      locationId: '',
      name: '',
      code: '',
      description: '',
      headDoctorId: '',
      isActive: true,
    },
  })

  // Populare formular la editare
  useEffect(() => {
    if (editData) {
      reset({
        locationId: editData.locationId,
        name: editData.name,
        code: editData.code,
        description: editData.description ?? '',
        headDoctorId: editData.headDoctorId ?? '',
        isActive: editData.isActive,
      })
    } else {
      reset({
        locationId: '',
        name: '',
        code: '',
        description: '',
        headDoctorId: '',
        isActive: true,
      })
    }
  }, [editData, reset])

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={520}
      title={isEdit ? 'Editează Departament' : 'Departament Nou'}
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
      <FormInput<DepartmentFormData>
        name="name"
        control={control}
        label="Denumire departament"
        placeholder="ex: Cardiologie"
        required
      />

      <div className="row g-3">
        <div className="col-md-6">
          <FormInput<DepartmentFormData>
            name="code"
            control={control}
            label="Cod"
            placeholder="ex: CARDIO"
            required
          />
        </div>
        <div className="col-md-6">
          <FormSelect<DepartmentFormData>
            name="locationId"
            control={control}
            label="Locație"
            options={locations.map(loc => ({ value: loc.id, label: loc.name }))}
            required
          />
        </div>
      </div>

      <FormInput<DepartmentFormData>
        name="description"
        control={control}
        label="Descriere"
        placeholder="Descriere opțională a departamentului"
        multiline
        rows={3}
      />

      <FormSelect<DepartmentFormData>
        name="headDoctorId"
        control={control}
        label="Șef departament"
        options={doctors.map(doc => ({ value: doc.id, label: `${doc.fullName}${doc.specialtyName ? ` (${doc.specialtyName})` : ''}` }))}
        showClearButton
        allowFiltering
      />

      {/* Status activ (doar la editare) */}
      {isEdit && (
        <div className={styles.formGroup}>
          <div className="form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              id="deptIsActive"
              {...register('isActive')}
            />
            <label className="form-check-label" htmlFor="deptIsActive">
              Departament activ
            </label>
          </div>
        </div>
      )}
    </AppModal>
  )
}
