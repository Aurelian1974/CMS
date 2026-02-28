import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { medicalTitleSchema, type MedicalTitleFormData } from '../../schemas/medicalTitle.schema'
import type { MedicalTitleDto } from '../../types/medicalTitle.types'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { AppButton } from '@/components/ui/AppButton'
import styles from './MedicalTitleFormModal.module.scss'

interface MedicalTitleFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: MedicalTitleFormData) => void
  isLoading: boolean
  /** Titulatura existentă pentru editare, null pentru creare */
  editData: MedicalTitleDto | null
}

export const MedicalTitleFormModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  editData,
}: MedicalTitleFormModalProps) => {
  const isEdit = !!editData

  const {
    control,
    handleSubmit,
    reset,
  } = useForm<MedicalTitleFormData>({
    resolver: zodResolver(medicalTitleSchema),
    defaultValues: {
      name: '',
      code: '',
      description: null,
      displayOrder: 0,
    },
  })

  // Populare formular la editare
  useEffect(() => {
    if (editData) {
      reset({
        name: editData.name,
        code: editData.code,
        description: editData.description,
        displayOrder: editData.displayOrder,
      })
    } else {
      reset({
        name: '',
        code: '',
        description: null,
        displayOrder: 0,
      })
    }
  }, [editData, reset])

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={520}
      title={isEdit ? 'Editează Titulatură' : 'Titulatură Nouă'}
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      bodyClassName={styles.body}
      footer={
        <>
          <AppButton variant="secondary" onClick={onClose} disabled={isLoading}>
            Anulează
          </AppButton>
          <AppButton
            type="submit"
            variant="primary"
            isLoading={isLoading}
            loadingText="Se salvează…"
          >
            {isEdit ? 'Actualizează' : 'Creează'}
          </AppButton>
        </>
      }
    >
      <FormInput<MedicalTitleFormData>
        name="name"
        control={control}
        label="Denumire"
        placeholder="ex: Medic specialist"
        required
      />

      <FormInput<MedicalTitleFormData>
        name="code"
        control={control}
        label="Cod"
        placeholder="ex: MEDIC_SPECIALIST"
        required
      />

      <FormInput<MedicalTitleFormData>
        name="description"
        control={control}
        label="Descriere"
        placeholder="Descriere opțională"
        multiline
        rows={2}
      />

      <FormInput<MedicalTitleFormData>
        name="displayOrder"
        control={control}
        label="Ordine afișare"
        type="number"
      />
    </AppModal>
  )
}
