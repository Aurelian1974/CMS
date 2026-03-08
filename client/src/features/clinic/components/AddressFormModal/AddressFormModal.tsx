import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { addressSchema, type AddressFormData } from '../../schemas/clinic.schema'
import type { ClinicAddressDto } from '../../types/clinic.types'
import { AppModal } from '@/components/ui/AppModal'
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

  const { control, handleSubmit, reset, register } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      addressType: 'Sediu Social',
      street: '',
      city: '',
      county: '',
      postalCode: undefined,
      country: 'România',
      isMain: false,
    },
  })

  useEffect(() => {
    if (editData) {
      reset({
        addressType: editData.addressType,
        street: editData.street,
        city: editData.city,
        county: editData.county,
        postalCode: editData.postalCode ?? '',
        country: editData.country,
        isMain: editData.isMain,
      })
    } else {
      reset({
        addressType: 'Sediu Social',
        street: '',
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
      maxWidth={520}
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

        <FormInput<AddressFormData>
          name="street"
          control={control}
          label="Stradă / Adresă"
          placeholder="ex: Str. Sănătății nr. 10, Sector 1"
          required
        />

        <div className="row g-2">
          <div className="col-md-6">
            <FormInput<AddressFormData>
              name="city"
              control={control}
              label="Oraș"
              placeholder="ex: București"
              required
            />
          </div>
          <div className="col-md-6">
            <FormInput<AddressFormData>
              name="county"
              control={control}
              label="Județ"
              placeholder="ex: Ilfov"
              required
            />
          </div>
        </div>

        <div className="row g-2">
          <div className="col-md-6">
            <FormInput<AddressFormData>
              name="postalCode"
              control={control}
              label="Cod poștal"
              placeholder="ex: 010100"
            />
          </div>
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
