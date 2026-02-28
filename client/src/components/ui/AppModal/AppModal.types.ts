import type { ReactNode, FormEventHandler } from 'react'

export interface ModalTab {
  key: string
  label: string | ((key: string) => ReactNode)
}

export interface AppModalProps {
  /** Controlează vizibilitatea modalului */
  isOpen: boolean
  /** Callback la închidere (overlay click, ESC, buton close) */
  onClose: () => void

  /** Lățimea maximă a modalului (default 900px) */
  maxWidth?: number | string

  /**
   * Titlu simplu — generează header standard (titlu + buton close).
   * Dacă `header` e furnizat, `title` e ignorat.
   */
  title?: string

  /**
   * Header custom (ReactNode) — înlocuiește complet header-ul standard.
   * Folosit pentru header-uri complexe (ex: gradient cu avatar).
   * Când e furnizat, responsabilitatea butonului close revine consumatorului.
   */
  header?: ReactNode

  /** Tab-uri — afișate între header și body */
  tabs?: ModalTab[]
  /** Tab-ul activ curent */
  activeTab?: string
  /** Callback la schimbarea tab-ului */
  onTabChange?: (key: string) => void

  /** Conținutul principal (body) — scrollabil */
  children: ReactNode

  /** Footer custom — afișat sub body, cu border-top */
  footer?: ReactNode

  /**
   * Tipul wrapper-ului pentru conținut (tabs + body + footer).
   * 'form' — wrappează în <form> (pentru modale cu formulare).
   * 'div' — wrappează în <div> (default).
   */
  as?: 'div' | 'form'

  /** Handler submit — doar când as='form' */
  onSubmit?: FormEventHandler<HTMLFormElement>

  /** Clasă CSS suplimentară pe containerul modal */
  className?: string

  /** Clasă CSS suplimentară pe body */
  bodyClassName?: string

  /** Activează container queries pe body (default false) */
  containerQuery?: boolean
}
