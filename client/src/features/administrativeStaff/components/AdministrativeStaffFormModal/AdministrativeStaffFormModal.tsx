import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { administrativeStaffSchema, type AdministrativeStaffFormData } from '../../schemas/administrativeStaff.schema'
import type { AdministrativeStaffDto, AdministrativePositionDto } from '../../types/administrativeStaff.types'
import type { DepartmentDto } from '@/features/departments/types/department.types'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { FormPhoneInput } from '@/components/forms/FormPhoneInput'
import { FormSelect } from '@/components/forms/FormSelect'
import { AppButton } from '@/components/ui/AppButton'
import styles from './AdministrativeStaffFormModal.module.scss'

interface AdministrativeStaffFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AdministrativeStaffFormData) => void
  isLoading: boolean
  /** Membru existent pentru editare, null pentru creare */
  editData: AdministrativeStaffDto | null
  departments: DepartmentDto[]
  positions: AdministrativePositionDto[]
  /** Eroare server (ex: email duplicat) — afișată în modal */
  serverError?: string | null
}

const EMPTY_FORM: AdministrativeStaffFormData = {
  departmentId: '',
  positionId: '',
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  isActive: true,
}

export const AdministrativeStaffFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
  departments,
  positions,
  serverError,
}: AdministrativeStaffFormModalProps) => {
  const isEdit = !!editData

  const { control, register, handleSubmit, reset } = useForm<AdministrativeStaffFormData>({
    resolver: zodResolver(administrativeStaffSchema),
    defaultValues: EMPTY_FORM,
  })

  useEffect(() => {
    if (!isOpen) return

    reset(editData
      ? {
          departmentId: editData.departmentId ?? '',
          positionId: editData.positionId ?? '',
          firstName: editData.firstName,
          lastName: editData.lastName,
          email: editData.email,
          phoneNumber: editData.phoneNumber ?? '',
          isActive: editData.isActive,
        }
      : EMPTY_FORM)
  }, [isOpen, editData, reset])

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={680}
      title={isEdit ? 'Editează Personal Administrativ' : 'Personal Administrativ Nou'}
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      bodyClassName={styles.body}
      footer={
        <>
          <AppButton variant="outline-secondary" onClick={onClose} disabled={isLoading}>
            Anulează
          </AppButton>
          <AppButton type="submit" variant="primary" isLoading={isLoading} loadingText="Se salvează...">
            {isEdit ? 'Salvează' : 'Adaugă'}
          </AppButton>
        </>
      }
    >
      {serverError && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {serverError}
        </div>
      )}

      <div className="row g-3">
        <div className="col-md-6">
          <FormInput<AdministrativeStaffFormData>
            name="lastName"
            control={control}
            label="Nume"
            placeholder="ex: Popescu"
            required
          />
        </div>
        <div className="col-md-6">
          <FormInput<AdministrativeStaffFormData>
            name="firstName"
            control={control}
            label="Prenume"
            placeholder="ex: Maria"
            required
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <FormInput<AdministrativeStaffFormData>
            name="email"
            control={control}
            label="Email"
            type="email"
            placeholder="ex: receptie@clinica.ro"
            required
          />
        </div>
        <div className="col-md-6">
          <FormPhoneInput<AdministrativeStaffFormData>
            name="phoneNumber"
            control={control}
            label="Telefon"
          />
        </div>
      </div>

      <div className="row g-3">
        <div className="col-md-6">
          <FormSelect<AdministrativeStaffFormData>
            name="positionId"
            control={control}
            label="Funcție"
            options={positions.map(p => ({ value: p.id, label: p.name }))}
            showClearButton
          />
        </div>
        <div className="col-md-6">
          <FormSelect<AdministrativeStaffFormData>
            name="departmentId"
            control={control}
            label="Departament"
            options={departments.map(d => ({ value: d.id, label: d.name }))}
            showClearButton
          />
        </div>
      </div>

      {isEdit && (
        <div className={styles.formGroup}>
          <div className="form-check form-switch">
            <input
              type="checkbox"
              className="form-check-input"
              id="adminStaffIsActive"
              {...register('isActive')}
            />
            <label className="form-check-label" htmlFor="adminStaffIsActive">
              Angajat activ
            </label>
          </div>
        </div>
      )}
    </AppModal>
  )
}
