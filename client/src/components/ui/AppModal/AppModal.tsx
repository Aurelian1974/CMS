import { useEffect, useCallback, useRef } from 'react'
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
  const tabListRef = useRef<HTMLDivElement>(null)

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

  // Navigare cu ← → între tab-uri
  const handleTabListKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (!tabs || !onTabChange) return
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return

      e.preventDefault()
      const currentIndex = tabs.findIndex((t) => t.key === activeTab)
      if (currentIndex === -1) return

      const nextIndex =
        e.key === 'ArrowRight'
          ? (currentIndex + 1) % tabs.length
          : (currentIndex - 1 + tabs.length) % tabs.length

      onTabChange(tabs[nextIndex].key)

      // Focus după re-render — setTimeout(0) așteaptă ca React să actualizeze DOM-ul
      setTimeout(() => {
        const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('button')
        buttons?.[nextIndex]?.focus()
      }, 0)
    },
    [tabs, activeTab, onTabChange],
  )

  if (!isOpen) return null

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
        <div
          ref={tabListRef}
          className={styles.tabs}
          role="tablist"
          onKeyDown={handleTabListKeyDown}
        >
          {tabs.map((tab) => {
            const label = typeof tab.label === 'function' ? tab.label(tab.key) : tab.label
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                className={`${styles.tab} ${isActive ? styles.tabActive : ''}`}
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
    <div className={styles.overlay}>
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
