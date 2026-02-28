import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { medicalTitleSchema, type MedicalTitleFormData } from '../../schemas/medicalTitle.schema'
import type { MedicalTitleDto } from '../../types/medicalTitle.types'
import { AppModal } from '@/components/ui/AppModal'
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
    register,
    handleSubmit,
    reset,
    formState: { errors },
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
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isLoading}>
            Anulează
          </button>
          <button type="submit" className="btn btn-primary" disabled={isLoading}>
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Se salvează…
              </>
            ) : (
              isEdit ? 'Actualizează' : 'Creează'
            )}
          </button>
        </>
      }
    >
            {/* Denumire */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Denumire <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`form-control${errors.name ? ' is-invalid' : ''}`}
                placeholder="ex: Medic specialist"
                {...register('name')}
              />
              {errors.name && <span className={styles.error}>{errors.name.message}</span>}
            </div>

            {/* Cod */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Cod <span className={styles.required}>*</span>
              </label>
              <input
                type="text"
                className={`form-control${errors.code ? ' is-invalid' : ''}`}
                placeholder="ex: MEDIC_SPECIALIST"
                {...register('code')}
              />
              {errors.code && <span className={styles.error}>{errors.code.message}</span>}
            </div>

            {/* Descriere */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Descriere</label>
              <textarea
                className={`form-control${errors.description ? ' is-invalid' : ''}`}
                rows={2}
                placeholder="Descriere opțională"
                {...register('description')}
              />
              {errors.description && <span className={styles.error}>{errors.description.message}</span>}
            </div>

            {/* Ordine afișare */}
            <div className={styles.formGroup}>
              <label className={styles.label}>Ordine afișare</label>
              <input
                type="number"
                className={`form-control${errors.displayOrder ? ' is-invalid' : ''}`}
                {...register('displayOrder', { valueAsNumber: true })}
              />
              {errors.displayOrder && <span className={styles.error}>{errors.displayOrder.message}</span>}
            </div>
    </AppModal>
  )
}
