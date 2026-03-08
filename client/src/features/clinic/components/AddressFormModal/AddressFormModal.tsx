import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addressSchema, type AddressFormData } from '../../schemas/clinic.schema'
import type { ClinicAddressDto } from '../../types/clinic.types'
import { AppModal } from '@/components/ui/AppModal'
import { AddressFields } from '@/components/forms/AddressFields'
import { FormInput } from '@/components/forms/FormInput'
import { AppButton } from '@/components/ui/AppButton'

const ADDRESS_TYPES = ['Sediu Social', 'Corespondenta', 'Punct de Lucru', 'Depozit', 'Alta']

interface AddressFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: AddressFormData) => void
  isLoading: boolean
  editData: ClinicAddressDto | null
}

export const AddressFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
}: AddressFormModalProps) => {
  const isEdit = !!editData

  const { control, handleSubmit, reset, setValue, register } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressType: 'Sediu Social',
      address: '',
      city: '',
      county: '',
      postalCode: '',
      country: 'România',
      isMain: false,
    },
  })

  useEffect(() => {
    if (editData) {
      reset({
        addressType: editData.addressType,
        address: editData.street,
        city: editData.city,
        county: editData.county,
        postalCode: editData.postalCode ?? '',
        country: editData.country,
        isMain: editData.isMain,
      })
    } else {
      reset({
        addressType: 'Sediu Social',
        address: '',
        city: '',
        county: '',
        postalCode: '',
        country: 'România',
        isMain: false,
      })
    }
  }, [editData, reset])

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={640}
      title={isEdit ? 'Editează Adresă' : 'Adresă Nouă'}
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      footer={
        <>
          <AppButton variant="outline-secondary" onClick={onClose} disabled={isLoading}>
            Anulează
          </AppButton>
          <AppButton type="submit" variant="primary" isLoading={isLoading} loadingText="Se salvează...">
            {isEdit ? 'Salvează' : 'Adaugă adresă'}
          </AppButton>
        </>
      }
    >
      <div className="d-flex flex-column gap-3">
        <div>
          <label className="form-label fw-medium" style={{ fontSize: '0.8125rem' }}>
            Tip adresă <span className="text-danger">*</span>
          </label>
          <Controller
            name="addressType"
            control={control}
            render={({ field }) => (
              <select className="form-select form-select-sm" {...field}>
                {ADDRESS_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          />
        </div>

        <AddressFields<AddressFormData>
          control={control}
          setValue={(name, value) => setValue(name as keyof AddressFormData, value)}
        />

        <div className="row g-2">
          <div className="col-md-6">
            <FormInput<AddressFormData>
              name="country"
              control={control}
              label="Țară"
              placeholder="ex: România"
              required
            />
          </div>
        </div>

        <div className="form-check">
          <input
            id="addrIsMain"
            type="checkbox"
            className="form-check-input"
            {...register('isMain')}
          />
          <label htmlFor="addrIsMain" className="form-check-label" style={{ fontSize: '0.875rem' }}>
            Adresă principală
          </label>
        </div>
      </div>
    </AppModal>
  )
}
