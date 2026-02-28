import { useEffect, useCallback } from 'react'
import type { AppModalProps } from './AppModal.types'
import styles from './AppModal.module.scss'

export const AppModal = ({
  isOpen,
  onClose,
  maxWidth = 900,
  title,
  header,
  tabs,
  activeTab,
  onTabChange,
  children,
  footer,
  as = 'div',
  onSubmit,
  className,
  bodyClassName,
  containerQuery = false,
}: AppModalProps) => {
  // Închide cu ESC
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    // Previne scroll pe body când modalul e deschis
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose()
  }

  // Stilul inline pentru max-width configurabil
  const modalStyle: React.CSSProperties = {
    maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth,
  }

  // Clasă body compusă
  const bodyClasses = [
    styles.body,
    containerQuery ? styles.bodyContainer : '',
    bodyClassName ?? '',
  ].filter(Boolean).join(' ')

  // ── Content wrapper (tabs + body + footer) ──
  const contentInner = (
    <>
      {tabs && tabs.length > 0 && (
        <div className={styles.tabs}>
          {tabs.map((tab) => {
            const label = typeof tab.label === 'function' ? tab.label(tab.key) : tab.label
            return (
              <button
                key={tab.key}
                type="button"
                className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
                onClick={() => onTabChange?.(tab.key)}
              >
                {label}
              </button>
            )
          })}
        </div>
      )}

      <div className={bodyClasses}>{children}</div>

      {footer && <div className={styles.footer}>{footer}</div>}
    </>
  )

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div
        className={`${styles.modal} ${className ?? ''}`}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header — custom sau standard */}
        {header
          ? header
          : title && (
              <div className={styles.header}>
                <h5 className={styles.title}>{title}</h5>
                <button
                  type="button"
                  className={styles.closeBtn}
                  onClick={onClose}
                  aria-label="Închide"
                >
                  &times;
                </button>
              </div>
            )}

        {/* Content wrapper */}
        {as === 'form' ? (
          <form className={styles.content} onSubmit={onSubmit} noValidate>
            {contentInner}
          </form>
        ) : (
          <div className={styles.content}>
            {contentInner}
          </div>
        )}
      </div>
    </div>
  )
}
