import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changeOwnPasswordSchema, type ChangeOwnPasswordFormData } from '../../schemas/user.schema'
import { AppModal } from '@/components/ui/AppModal'
import { FormInput } from '@/components/forms/FormInput'
import { AppButton } from '@/components/ui/AppButton'
import styles from './ChangeOwnPasswordModal.module.scss'

interface ChangeOwnPasswordModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ChangeOwnPasswordFormData) => void
  isLoading: boolean
  /** Eroare server */
  serverError?: string | null
  /**
   * Schimbare impusă după un reset administrativ: modalul nu se poate închide,
   * iar mesajul explică de ce.
   */
  forced?: boolean
}

/**
 * Schimbarea propriei parole. Spre deosebire de resetul administrativ, cere parola
 * curentă — dovada posesiei contului. Contul vizat e determinat de token pe backend,
 * deci componenta nu primește niciun id.
 */
export const ChangeOwnPasswordModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  serverError,
  forced = false,
}: ChangeOwnPasswordModalProps) => {
  const { control, handleSubmit, reset } = useForm<ChangeOwnPasswordFormData>({
    resolver: zodResolver(changeOwnPasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (isOpen) {
      reset({ currentPassword: '', newPassword: '', confirmPassword: '' })
    }
  }, [isOpen, reset])

  return (
    <AppModal
      isOpen={isOpen}
      onClose={forced ? () => {} : onClose}
      maxWidth={480}
      // La schimbarea impusă folosim `header`: varianta cu `title` randează un buton
      // × care nu ar avea ce închide.
      {...(forced
        ? { header: <h5 className="mb-0">Schimbarea parolei este obligatorie</h5> }
        : { title: 'Schimbă-ți parola' })}
      as="form"
      onSubmit={handleSubmit(onSubmit)}
      bodyClassName={styles.body}
      footer={
        <>
          {!forced && (
            <AppButton variant="outline-secondary" onClick={onClose} disabled={isLoading}>
              Anulează
            </AppButton>
          )}
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
      {forced && (
        <div className="alert alert-warning py-2 mb-3" role="alert">
          Parola contului a fost resetată de un administrator, care o cunoaște.
          Alegeți una nouă pentru a continua.
        </div>
      )}

      {serverError && (
        <div className="alert alert-danger py-2 mb-3" role="alert">
          {serverError}
        </div>
      )}

      <FormInput<ChangeOwnPasswordFormData>
        name="currentPassword"
        control={control}
        label="Parola curentă"
        type="password"
        placeholder="Parola folosită acum"
        required
      />

      <FormInput<ChangeOwnPasswordFormData>
        name="newPassword"
        control={control}
        label="Parolă nouă"
        type="password"
        placeholder="Minim 12 caractere"
        required
      />

      <FormInput<ChangeOwnPasswordFormData>
        name="confirmPassword"
        control={control}
        label="Confirmă parola"
        type="password"
        placeholder="Repetă parola nouă"
        required
      />
    </AppModal>
  )
}
