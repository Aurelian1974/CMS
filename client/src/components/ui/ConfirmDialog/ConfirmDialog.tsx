import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { AppButton, type ButtonVariant } from '@/components/ui/AppButton'
import styles from './ConfirmDialog.module.scss'

export interface ConfirmDialogProps {
  isOpen: boolean
  title: string
  message: React.ReactNode
  onConfirm: () => void
  onCancel: () => void
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: ButtonVariant
  isLoading?: boolean
  loadingText?: string
}

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Dialog de confirmare accesibil: portal în body (nu e prins în formularele paginii),
 * focus trap, Escape = anulare, focusul revine pe elementul care l-a deschis.
 */
export const ConfirmDialog = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Confirmă',
  cancelLabel = 'Anulează',
  confirmVariant = 'primary',
  isLoading = false,
  loadingText,
}: ConfirmDialogProps) => {
  const titleId = useId()
  const messageId = useId()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCancelRef = useRef(onCancel)
  onCancelRef.current = onCancel

  useEffect(() => {
    if (!isOpen) return
    const opener = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    dialog?.querySelector<HTMLElement>(FOCUSABLE)?.focus()

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onCancelRef.current()
        return
      }
      if (e.key !== 'Tab' || !dialog) return
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }

    // Capture: Escape nu trebuie să ajungă și la handler-ele globale (ex. colapsarea sidebar-ului)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      opener?.focus?.()
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className={styles.overlay} onClick={onCancel}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className={styles.title}>{title}</h2>
        <div id={messageId} className={styles.text}>{message}</div>
        <div className={styles.actions}>
          <AppButton type="button" variant="outline-secondary" size="sm" onClick={onCancel}>
            {cancelLabel}
          </AppButton>
          <AppButton
            type="button"
            variant={confirmVariant}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
            loadingText={loadingText}
          >
            {confirmLabel}
          </AppButton>
        </div>
      </div>
    </div>,
    document.body,
  )
}
