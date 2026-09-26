import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppButton } from '@/components/ui/AppButton'
import { cancelPrescriptionSchema, type CancelPrescriptionFormData } from '../../schemas/prescription.schema'
import styles from './CancelPrescriptionDialog.module.scss'

interface CancelPrescriptionDialogProps {
  /** Seria + numărul rețetei; null = dialog închis */
  label: string | null
  isLoading: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

export const CancelPrescriptionDialog = ({ label, isLoading, onCancel, onConfirm }: CancelPrescriptionDialogProps) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CancelPrescriptionFormData>({
    resolver: zodResolver(cancelPrescriptionSchema),
    defaultValues: { reason: '' },
  })

  useEffect(() => {
    if (label) reset({ reason: '' })
  }, [label, reset])

  if (!label) return null

  // Portal: dialogul poate fi deschis din formularul consultației; nu trebuie să-l trimită
  return createPortal(
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Anulare rețetă">
        <h6 className={styles.title}>Anulare rețetă {label}</h6>
        <p className={styles.text}>
          Rețeta anulată rămâne în istoric și nu mai poate fi eliberată. Pentru corectare se emite o rețetă nouă.
        </p>
        <textarea
          className={styles.textarea}
          placeholder="Motivul anulării (obligatoriu)"
          maxLength={500}
          autoFocus
          {...register('reason')}
        />
        {errors.reason && <div className={styles.error}>{errors.reason.message}</div>}
        <div className={styles.actions}>
          <AppButton variant="outline-secondary" size="sm" onClick={onCancel} disabled={isLoading}>
            Renunță
          </AppButton>
          <AppButton
            variant="danger"
            size="sm"
            isLoading={isLoading}
            loadingText="Se anulează..."
            onClick={handleSubmit((data) => onConfirm(data.reason))}
          >
            Anulează rețeta
          </AppButton>
        </div>
      </div>
    </div>,
    document.body,
  )
}
