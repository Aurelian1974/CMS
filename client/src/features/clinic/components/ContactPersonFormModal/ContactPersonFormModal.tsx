import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactPersonSchema, type ContactPersonFormData } from '../../schemas/clinic.schema'
import type { ClinicContactPersonDto } from '../../types/clinic.types'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { FormPhoneInput } from '@/components/forms/FormPhoneInput'
import { AppButton } from '@/components/ui/AppButton'

interface ContactPersonFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ContactPersonFormData) => void
  isLoading: boolean
  editData: ClinicContactPersonDto | null
}

export const ContactPersonFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
}: ContactPersonFormModalProps) => {
  const isEdit = !!editData

  const { handleSubmit, reset, register, control } = useForm<ContactPersonFormData>({
    resolver: zodResolver(contactPersonSchema),
    defaultValues: {
      name: '',
      function: undefined,
      phoneNumber: undefined,
      email: undefined,
      isMain: false,
    },
  })

  useEffect(() => {
    if (editData) {
      reset({
        name: editData.name,
        function: editData.function ?? undefined,
        phoneNumber: editData.phoneNumber ?? undefined,
        email: editData.email ?? undefined,
        isMain: editData.isMain,
      })
    } else {
      reset({ name: '', function: undefined, phoneNumber: undefined, email: undefined, isMain: false })
    }
  }, [editData, reset])

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={480}
      title={isEdit ? 'Editează Persoană de Contact' : 'Persoană de Contact Nouă'}
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      footer={
        <>
          <AppButton variant="outline-secondary" onClick={onClose} disabled={isLoading}>
            Anulează
          </AppButton>
          <AppButton type="submit" variant="primary" isLoading={isLoading} loadingText="Se salvează...">
            {isEdit ? 'Salvează' : 'Adaugă persoană'}
          </AppButton>
        </>
      }
    >
      <div className="d-flex flex-column gap-3">
        <FormInput<ContactPersonFormData>
          name="name"
          control={control}
          label="Nume"
          placeholder="ex: Ion Popescu"
          required
        />

        <FormInput<ContactPersonFormData>
          name="function"
          control={control}
          label="Funcție (opțional)"
          placeholder="ex: Director, Manager"
        />

        <FormPhoneInput<ContactPersonFormData>
          name="phoneNumber"
          control={control}
          label="Telefon (opțional)"
        />

        <FormInput<ContactPersonFormData>
          name="email"
          control={control}
          label="Email (opțional)"
          placeholder="ex: ion.popescu@clinica.ro"
        />

        <div className="form-check">
          <input
            id="contactPersonIsMain"
            type="checkbox"
            className="form-check-input"
            {...register('isMain')}
          />
          <label htmlFor="contactPersonIsMain" className="form-check-label" style={{ fontSize: '0.875rem' }}>
            Persoană de contact principală
          </label>
        </div>
      </div>
    </AppModal>
  )
}
