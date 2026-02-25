import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { changePasswordSchema, type ChangePasswordFormData } from '../../schemas/user.schema'
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
    register,
    handleSubmit,
    reset,
    formState: { errors },
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

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h5 className={styles.modalTitle}>
            Schimbă parola — {userName}
          </h5>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Închide">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className={styles.modalBody}>

            {/* Eroare server */}
            {serverError && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                {serverError}
              </div>
            )}

            {/* Parolă nouă */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Parolă nouă <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                className={`form-control${errors.newPassword ? ' is-invalid' : ''}`}
                placeholder="Minim 6 caractere"
                autoComplete="new-password"
                {...register('newPassword')}
              />
              {errors.newPassword && <span className={styles.error}>{errors.newPassword.message}</span>}
            </div>

            {/* Confirmare parolă */}
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Confirmă parola <span className={styles.required}>*</span>
              </label>
              <input
                type="password"
                className={`form-control${errors.confirmPassword ? ' is-invalid' : ''}`}
                placeholder="Repetă parola"
                autoComplete="new-password"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && <span className={styles.error}>{errors.confirmPassword.message}</span>}
            </div>
          </div>

          <div className={styles.modalFooter}>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Anulează
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Se salvează...' : 'Schimbă parola'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
