import { useEffect, useRef } from 'react'
import type { ContextMenuItem, ContextMenuParams } from '../AppDataGrid.types'

export interface GridContextMenuProps {
  items: ContextMenuItem[]
  position: { x: number; y: number } | null
  params: ContextMenuParams
  onClose: () => void
}

export function GridContextMenu(props: GridContextMenuProps) {
  const { items, position, params, onClose } = props
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!position) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [position, onClose])

  // Escape key
  useEffect(() => {
    if (!position) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [position, onClose])

  if (!position) return null

  return (
    <div
      ref={menuRef}
      className="adg-context-menu"
      style={{ top: position.y, left: position.x }}
      role="menu"
    >
      {items.map(item => {
        if (item.separator) {
          return <div key={item.id} className="adg-context-menu__separator" role="separator" />
        }

        const disabled = typeof item.disabled === 'function'
          ? item.disabled(params)
          : item.disabled

        return (
          <button
            key={item.id}
            className={`adg-context-menu__item ${disabled ? 'adg-context-menu__item--disabled' : ''}`}
            role="menuitem"
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                item.action?.(params)
                onClose()
              }
            }}
          >
            {item.icon && <span className="adg-context-menu__icon">{item.icon}</span>}
            <span className="adg-context-menu__text">{item.text}</span>
          </button>
        )
      })}
    </div>
  )
}
