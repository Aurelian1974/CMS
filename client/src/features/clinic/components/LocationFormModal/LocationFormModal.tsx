import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { clinicLocationSchema, type ClinicLocationFormData } from '../../schemas/clinic.schema'
import type { ClinicLocationDto } from '../../types/clinic.types'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { AddressFields } from '@/components/forms/AddressFields'
import { AppButton } from '@/components/ui/AppButton'
import styles from './LocationFormModal.module.scss'

interface LocationFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ClinicLocationFormData) => void
  isLoading: boolean
  /** Locația existentă pentru editare, null pentru creare */
  editData: ClinicLocationDto | null
}

export const LocationFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
}: LocationFormModalProps) => {
  const isEdit = !!editData

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
  } = useForm<ClinicLocationFormData>({
    resolver: zodResolver(clinicLocationSchema),
    defaultValues: {
      name: '',
      address: '',
      city: '',
      county: '',
      postalCode: '',
      phoneNumber: '',
      email: '',
      isPrimary: false,
    },
  })

  // Populare formular la editare
  useEffect(() => {
    if (editData) {
      reset({
        name: editData.name,
        address: editData.address,
        city: editData.city,
        county: editData.county,
        postalCode: editData.postalCode ?? '',
        phoneNumber: editData.phoneNumber ?? '',
        email: editData.email ?? '',
        isPrimary: editData.isPrimary,
      })
    } else {
      reset({
        name: '',
        address: '',
        city: '',
        county: '',
        postalCode: '',
        phoneNumber: '',
        email: '',
        isPrimary: false,
      })
    }
  }, [editData, reset])

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={520}
      title={isEdit ? 'Editează Locație' : 'Locație Nouă'}
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
            {isEdit ? 'Salvează' : 'Adaugă locație'}
          </AppButton>
        </>
      }
    >
      <FormInput<ClinicLocationFormData>
        name="name"
        control={control}
        label="Denumire locație"
        placeholder="ex: Sediu Central"
        required
      />

      <AddressFields<ClinicLocationFormData>
        control={control}
        setValue={setValue}
      />

      <div className="row g-3 mt-0">
        <div className="col-md-6">
          <FormInput<ClinicLocationFormData>
            name="phoneNumber"
            control={control}
            label="Telefon"
            placeholder="ex: 021 123 4567"
          />
        </div>
        <div className="col-md-6">
          <FormInput<ClinicLocationFormData>
            name="email"
            control={control}
            label="Email"
            type="email"
            placeholder="ex: locatie@clinica.ro"
          />
        </div>
      </div>

      {/* Locație principală */}
      <div className={styles.checkGroup}>
        <input
          type="checkbox"
          className="form-check-input"
          id="isPrimary"
          {...register('isPrimary')}
        />
        <label className={styles.label} htmlFor="isPrimary">
          Locație principală (sediu social)
        </label>
      </div>
    </AppModal>
  )
}
