import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema, type ChangePasswordFormData } from '../../schemas/user.schema'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { AppButton } from '@/components/ui/AppButton'
import styles from './ChangePasswordModal.module.scss'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ChangePasswordFormData) => void
  isLoading: boolean
  /** Numele utilizatorului — afișat în titlu */
  userName: string
  /** Eroare server */
  serverError?: string | null
}

export const ChangePasswordModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  userName,
  serverError,
}: ChangePasswordModalProps) => {
  const {
    control,
    handleSubmit,
    reset,
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
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
      title={`Schimbă parola — ${userName}`}
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
            Schimbă parola
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
      <FormInput<ChangePasswordFormData>
        name="newPassword"
        control={control}
        label="Parolă nouă"
        type="password"
        placeholder="Minim 6 caractere"
        required
      />

      {/* Confirmare parolă */}
      <FormInput<ChangePasswordFormData>
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
