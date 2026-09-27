import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { AppModal } from '@/components/ui/AppModal'
import { AppButton } from '@/components/ui/AppButton'
import { FormInput } from '@/components/forms/FormInput'
import { reasonSchema, type ReasonFormData } from '../../schemas/billing.schema'
import { InlineFeedback } from '../InlineFeedback'
import styles from './ReasonModal.module.scss'

interface ReasonModalProps {
  isOpen: boolean
  title: string
  /** Explicația consecinței acțiunii — afișată deasupra câmpului. */
  description: React.ReactNode
  confirmLabel: string
  isLoading: boolean
  /** Eroarea ultimei încercări — afișată în dialog. */
  error?: string | null
  onClose: () => void
  onConfirm: (reason: string) => void
}

/** Confirmare cu motiv obligatoriu — anulare plată, stornare factură (motivul ajunge în audit). */
export const ReasonModal = ({ isOpen, title, description, confirmLabel, isLoading, error, onClose, onConfirm }: ReasonModalProps) => {
  const { control, handleSubmit, reset } = useForm<ReasonFormData>({
    resolver: zodResolver(reasonSchema),
    defaultValues: { reason: '' },
  })

  useEffect(() => { if (isOpen) reset({ reason: '' }) }, [isOpen, reset])

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={520}
      title={title}
      as="form"
      onSubmit={handleSubmit((d) => onConfirm(d.reason))}
      bodyClassName={styles.body}
      footer={
        <>
          <AppButton type="button" variant="secondary" onClick={onClose} disabled={isLoading}>Renunță</AppButton>
          <AppButton type="submit" variant="danger" isLoading={isLoading} loadingText="Se procesează…">{confirmLabel}</AppButton>
        </>
      }
    >
      <InlineFeedback errorMsg={error} />
      <div className={styles.description}>{description}</div>
      <FormInput<ReasonFormData> name="reason" control={control} label="Motiv" required multiline rows={3} maxLength={500} />
    </AppModal>
  )
}
