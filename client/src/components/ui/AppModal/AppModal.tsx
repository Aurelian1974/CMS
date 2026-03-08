import { useEffect, useCallback, useRef, useState } from 'react'
import type { AppModalProps } from './AppModal.types'
import styles from './AppModal.module.scss'

// Dimensiuni minime pentru resize
const MIN_W = 320
const MIN_H = 200

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
  const tabListRef  = useRef<HTMLDivElement>(null)
  const modalRef    = useRef<HTMLDivElement>(null)
  const dragState   = useRef<{ startX: number; startY: number; origLeft: number; origTop: number } | null>(null)
  const resizeState = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null)

  // Poziție și dimensiune — null = nesetat (modalul stă centrat prin CSS)
  const [pos,  setPos]  = useState<{ left: number; top: number } | null>(null)
  const [size, setSize] = useState<{ width: number; height: number } | null>(null)

  // Reset la fiecare deschidere — modalul pornește centrat
  useEffect(() => {
    if (isOpen) {
      setPos(null)
      setSize(null)
    }
  }, [isOpen])

  // ESC închide
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() },
    [onClose],
  )

  useEffect(() => {
    if (!isOpen) return
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  // ── DRAG ──────────────────────────────────────────────────────────────────
  const onDragPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Ignoră click pe butoane din header (close, etc.)
    if ((e.target as HTMLElement).closest('button')) return

    const el = modalRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    dragState.current = {
      startX:   e.clientX,
      startY:   e.clientY,
      origLeft: rect.left,
      origTop:  rect.top,
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.preventDefault()
  }, [])

  const onDragPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragState.current
    if (!d) return

    const dx = e.clientX - d.startX
    const dy = e.clientY - d.startY

    const newLeft = Math.max(0, Math.min(window.innerWidth  - (modalRef.current?.offsetWidth  ?? 400), d.origLeft + dx))
    const newTop  = Math.max(0, Math.min(window.innerHeight - (modalRef.current?.offsetHeight ?? 300), d.origTop  + dy))

    setPos({ left: newLeft, top: newTop })
  }, [])

  const onDragPointerUp = useCallback(() => {
    dragState.current = null
  }, [])

  // ── RESIZE ────────────────────────────────────────────────────────────────
  const onResizePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = modalRef.current
    if (!el) return

    const rect = el.getBoundingClientRect()
    resizeState.current = {
      startX: e.clientX,
      startY: e.clientY,
      origW:  rect.width,
      origH:  rect.height,
    }
    // Fixează poziția la primul resize dacă era centrat prin CSS
    if (!pos) {
      setPos({ left: rect.left, top: rect.top })
    }
    e.currentTarget.setPointerCapture(e.pointerId)
    e.stopPropagation()
    e.preventDefault()
  }, [pos])

  const onResizePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const r = resizeState.current
    if (!r) return

    const newW = Math.max(MIN_W, r.origW + (e.clientX - r.startX))
    const newH = Math.max(MIN_H, r.origH + (e.clientY - r.startY))
    setSize({ width: newW, height: newH })
  }, [])

  const onResizePointerUp = useCallback(() => {
    resizeState.current = null
  }, [])

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

      // Focus după re-render
      setTimeout(() => {
        const buttons = tabListRef.current?.querySelectorAll<HTMLButtonElement>('button')
        buttons?.[nextIndex]?.focus()
      }, 0)
    },
    [tabs, activeTab, onTabChange],
  )

  if (!isOpen) return null

  // ── Stil modal (poziție + dimensiune) ─────────────────────────────────────
  const maxW = typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth

  const modalStyle: React.CSSProperties = pos
    ? {
        // Modalul a fost mutat — poziție fixă explicită, nu mai e centrat prin flex
        position: 'fixed',
        left:     pos.left,
        top:      pos.top,
        width:    size ? `${size.width}px` : undefined,
        height:   size ? `${size.height}px` : undefined,
        maxWidth: size ? 'none' : maxW,
        maxHeight: size ? 'none' : '90vh',
        margin:   0,
      }
    : {
        // Centrat prin overlay flex (starea inițială)
        maxWidth: size ? 'none' : maxW,
        width:    size ? `${size.width}px` : undefined,
        height:   size ? `${size.height}px` : undefined,
        maxHeight: size ? 'none' : '90vh',
      }

  const bodyClasses = [
    styles.body,
    containerQuery ? styles.bodyContainer : '',
    bodyClassName ?? '',
  ].filter(Boolean).join(' ')

  // ── Header drag wrapper ────────────────────────────────────────────────────
  const dragProps = {
    onPointerDown: onDragPointerDown,
    onPointerMove: onDragPointerMove,
    onPointerUp:   onDragPointerUp,
    className:     styles.headerDrag,
  }

  const builtHeader = header
    ? <div {...dragProps}>{header}</div>
    : title
      ? (
          <div {...dragProps}>
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
          </div>
        )
      : null

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
        ref={modalRef}
        className={`${styles.modal} ${className ?? ''}`}
        style={modalStyle}
        onClick={(e) => e.stopPropagation()}
      >
        {builtHeader}

        {as === 'form' ? (
          <form className={styles.content} onSubmit={onSubmit} noValidate>
            {contentInner}
          </form>
        ) : (
          <div className={styles.content}>
            {contentInner}
          </div>
        )}

        {/* Handle resize — colț dreapta-jos */}
        <div
          className={styles.resizeHandle}
          onPointerDown={onResizePointerDown}
          onPointerMove={onResizePointerMove}
          onPointerUp={onResizePointerUp}
          title="Redimensionează"
        />
      </div>
    </div>
  )
}
