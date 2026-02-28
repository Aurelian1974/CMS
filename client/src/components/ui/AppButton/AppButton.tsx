import type { AppButtonProps } from './AppButton.types'
import styles from './AppButton.module.scss'

/** Map variant prop → CSS module class */
const variantClass: Record<string, string> = {
  primary: styles.primary,
  secondary: styles.secondary,
  danger: styles.danger,
  ghost: styles.ghost,
  'outline-primary': styles.outlinePrimary,
  'outline-secondary': styles.outlineSecondary,
  'outline-danger': styles.outlineDanger,
}

/**
 * Buton reutilizabil cu variante, dimensiuni, stare loading, și iconițe.
 * Înlocuiește toate `<button className="btn btn-*">` din proiect.
 */
export const AppButton: React.FC<AppButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  leftIcon,
  rightIcon,
  fullWidth = false,
  type = 'button',
  children,
  className,
  disabled,
  ...rest
}) => {
  const classes = [
    styles.button,
    variantClass[variant] || styles.primary,
    styles[size],
    fullWidth && styles.fullWidth,
    isLoading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      {...rest}
    >
      {isLoading ? (
        <>
          <span className={styles.spinner} />
          {loadingText ?? children}
        </>
      ) : (
        <>
          {leftIcon && <span className={styles.icon}>{leftIcon}</span>}
          {children}
          {rightIcon && <span className={styles.icon}>{rightIcon}</span>}
        </>
      )}
    </button>
  )
}
