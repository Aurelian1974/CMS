import styles from './LoadingSpinner.module.scss'

interface LoadingSpinnerProps {
  /** Modul de afișare: fullPage = centrat vertical, inline = compact */
  mode?: 'fullPage' | 'inline'
  /** Dimensiunea spinnerului */
  size?: 'sm' | 'md' | 'lg'
  /** Text afișat sub spinner (ex: „Se încarcă...") */
  text?: string
  /** Clasă CSS suplimentară */
  className?: string
}

/**
 * Spinner reutilizabil pentru stări de încărcare.
 * fullPage — centrat cu min-height, ideal pentru pagini/carduri.
 * inline — compact, ideal pentru secțiuni, tab-uri, modale.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  mode = 'fullPage',
  size = 'md',
  text = 'Se încarcă...',
  className,
}) => (
  <div
    className={`${styles.container} ${styles[mode]}${className ? ` ${className}` : ''}`}
    role="status"
    aria-busy="true"
    aria-label={text}
  >
    <div className={`${styles.spinner} ${styles[size]}`} />
    {text && <span className={styles.text}>{text}</span>}
  </div>
)
