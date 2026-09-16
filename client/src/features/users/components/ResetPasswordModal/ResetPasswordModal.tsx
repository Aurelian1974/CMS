import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordFormData } from '../../schemas/user.schema'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { AppButton } from '@/components/ui/AppButton'
import styles from './ResetPasswordModal.module.scss'

interface ResetPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ResetPasswordFormData) => void
  isLoading: boolean
  /** Numele utilizatorului — afișat în titlu */
  userName: string
  /** Eroare server */
  serverError?: string | null
}

export const ResetPasswordModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  userName,
  serverError,
}: ResetPasswordModalProps) => {
  const {
    control,
    handleSubmit,
    reset,
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  // Reset la deschidere/închidere
  useEffect(() => {
    if (isOpen) {
      reset({ newPassword: '', confirmPassword: '' })
    }
  }, [isOpen, reset])

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth={480}
      title={`Resetează parola — ${userName}`}
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
            Resetează parola
          </AppButton>
        </>
      }
    >
      {/* Eroare server */}
      {serverError && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {serverError}
        </div>
      )}

      {/* Parolă nouă */}
      <FormInput<ResetPasswordFormData>
        name="newPassword"
        control={control}
        label="Parolă nouă"
        type="password"
        placeholder="Minim 12 caractere"
        required
      />

      {/* Confirmare parolă */}
      <FormInput<ResetPasswordFormData>
        name="confirmPassword"
        control={control}
        label="Confirmă parola"
        type="password"
        placeholder="Repetă parola"
        required
      />
    </AppModal>
  )
}
