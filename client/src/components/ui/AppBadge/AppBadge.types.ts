/**
 * Variante de culoare disponibile pentru badge.
 * Fiecare variantă are o combinație background + text color predefinită.
 */
export type BadgeVariant =
  | 'primary'       // Albastru pastel — specialitate, titulatură, default
  | 'success'       // Verde — activ, severitate ușoară
  | 'danger'        // Roșu pastel — grupă sanguină, severitate severă
  | 'warning'       // Galben — severitate moderată
  | 'info'          // Albastru info
  | 'neutral'       // Gri — inactiv, default fallback
  | 'accent'        // Portocaliu cald — recepționer
  | 'purple'        // Mov — manager clinică
  | 'critical'      // Roșu intens — anafilaxie

export interface AppBadgeProps {
  /** Varianta de culoare */
  variant?: BadgeVariant
  /** Afișează un dot indicator (●) înaintea textului — pentru status badges */
  withDot?: boolean
  /** Font monospace — pentru coduri (CNP, parafe) */
  mono?: boolean
  /** Conținutul badge-ului */
  children: React.ReactNode
  /** Clasă CSS suplimentară */
  className?: string
}
