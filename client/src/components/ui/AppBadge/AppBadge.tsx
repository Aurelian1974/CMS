import type { AppBadgeProps } from './AppBadge.types'
import styles from './AppBadge.module.scss'

/**
 * Badge pill reutilizabil — afișează etichete colorate în grid-uri și detalii.
 *
 * Variante: primary | success | danger | warning | info | neutral | accent | purple | critical
 * Opțiuni: withDot (indicator ●), mono (font monospace pentru coduri)
 */
export const AppBadge: React.FC<AppBadgeProps> = ({
  variant = 'primary',
  withDot = false,
  mono = false,
  children,
  className,
}) => {
  const classes = [
    styles.badge,
    styles[variant],
    mono ? styles.mono : '',
    className ?? '',
  ].filter(Boolean).join(' ')

  return (
    <span className={classes}>
      {withDot && <span className={styles.dot} />}
      {children}
    </span>
  )
}
