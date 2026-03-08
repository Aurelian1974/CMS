import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { contactSchema, type ContactFormData } from '../../schemas/clinic.schema'
import type { ClinicContactDto } from '../../types/clinic.types'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { AppButton } from '@/components/ui/AppButton'

const CONTACT_TYPES = ['Email', 'Telefon', 'Website', 'Fax']

interface ContactFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ContactFormData) => void
  isLoading: boolean
  editData: ClinicContactDto | null
}

export const ContactFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
}: ContactFormModalProps) => {
  const isEdit = !!editData

  const { control, handleSubmit, reset, register } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      contactType: 'Email',
      value: '',
      label: undefined,
      isMain: false,
    },
  })

  useEffect(() => {
    if (editData) {
      reset({
        contactType: editData.contactType,
        value: editData.value,
        label: editData.label ?? undefined,
        isMain: editData.isMain,
      })
    } else {
      reset({ contactType: 'Email', value: '', label: undefined, isMain: false })
    }
  }, [editData, reset])

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={440}
      title={isEdit ? 'Editează Contact' : 'Contact Nou'}
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      footer={
        <>
          <AppButton variant="outline-secondary" onClick={onClose} disabled={isLoading}>
            Anulează
          </AppButton>
          <AppButton type="submit" variant="primary" isLoading={isLoading} loadingText="Se salvează...">
            {isEdit ? 'Salvează' : 'Adaugă contact'}
          </AppButton>
        </>
      }
    >
      <div className="d-flex flex-column gap-3">
        <div>
          <label className="form-label fw-medium" style={{ fontSize: '0.8125rem' }}>
            Tip contact <span className="text-danger">*</span>
          </label>
          <Controller
            name="contactType"
            control={control}
            render={({ field }) => (
              <select className="form-select form-select-sm" {...field}>
                {CONTACT_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          />
        </div>

        <FormInput<ContactFormData>
          name="value"
          control={control}
          label="Valoare"
          placeholder="ex: contact@clinica.ro"
          required
        />

        <FormInput<ContactFormData>
          name="label"
          control={control}
          label="Etichetă (opțional)"
          placeholder="ex: Recepție, Urgențe"
        />

        <div className="form-check">
          <input
            id="contactIsMain"
            type="checkbox"
            className="form-check-input"
            {...register('isMain')}
          />
          <label htmlFor="contactIsMain" className="form-check-label" style={{ fontSize: '0.875rem' }}>
            Contact principal
          </label>
        </div>
      </div>
    </AppModal>
  )
}
