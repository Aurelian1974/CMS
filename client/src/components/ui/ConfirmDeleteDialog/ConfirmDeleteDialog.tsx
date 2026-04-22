import { AppButton } from '@/components/ui/AppButton'
import styles from './ConfirmDeleteDialog.module.scss'

interface ConfirmDeleteDialogProps {
  /** Numele entității care urmează să fie ștearsă; null/undefined = dialog închis */
  name: string | null | undefined
  onCancel: () => void
  onConfirm: () => void
  isLoading?: boolean
  /** Textul titlului; default: "Confirmare ștergere" */
  title?: string
  /** Textul principal; dacă nu e dat, generează: "Sigur dorești să ștergi <name>?" */
  message?: React.ReactNode
  confirmLabel?: string
  cancelLabel?: string
}

/**
 * Dialog confirmare ștergere reutilizabil — overlay + dialog centrat.
 * Înlocuiește blocuri identice de 25+ linii JSX din fiecare pagină cu grid.
 */
export const ConfirmDeleteDialog = ({
  name,
  onCancel,
  onConfirm,
  isLoading = false,
  title = 'Confirmare ștergere',
  message,
  confirmLabel = 'Șterge',
  cancelLabel = 'Anulează',
}: ConfirmDeleteDialogProps) => {
  if (!name && !message) return null

  return (
    <div className={styles.overlay} onClick={onCancel}>
      <div className={styles.dialog} onClick={(e) => e.stopPropagation()}>
        <h6 className={styles.title}>{title}</h6>
        <p className={styles.text}>
          {message ?? (
            <>Sigur dorești să ștergi <strong>{name}</strong>?</>
          )}
        </p>
        <div className={styles.actions}>
          <AppButton variant="outline-secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </AppButton>
          <AppButton
            variant="danger"
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText="Se șterge..."
          >
            {confirmLabel}
          </AppButton>
        </div>
      </div>
    </div>
  )
}
