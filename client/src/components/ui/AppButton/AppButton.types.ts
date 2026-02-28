import type { ReactNode, ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline-primary' | 'outline-secondary' | 'outline-danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface AppButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  /** Varianta vizuală */
  variant?: ButtonVariant
  /** Dimensiunea butonului */
  size?: ButtonSize
  /** Stare de încărcare — afișează spinner și dezactivează butonul */
  isLoading?: boolean
  /** Text afișat în timpul încărcării (default: copiii originali) */
  loadingText?: string
  /** Iconiță afișată înaintea textului */
  leftIcon?: ReactNode
  /** Iconiță afișată după text */
  rightIcon?: ReactNode
  /** Butonul ocupă toată lățimea containerului */
  fullWidth?: boolean
  /** Tipul butonului HTML */
  type?: 'button' | 'submit' | 'reset'
  /** Conținut buton */
  children: ReactNode
}
