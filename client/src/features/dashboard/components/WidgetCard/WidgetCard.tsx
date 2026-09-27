import { Link } from 'react-router-dom'
import styles from './WidgetCard.module.scss'

interface WidgetCardProps {
  title: string
  count?: number
  linkTo?: string
  linkLabel?: string
  isEmpty?: boolean
  emptyText?: string
  children?: React.ReactNode
}

/** Shell comun al widget-urilor de tip listă / panou: titlu, contor, link, stare goală. */
export const WidgetCard = ({
  title,
  count,
  linkTo,
  linkLabel = 'Vezi tot',
  isEmpty = false,
  emptyText = 'Nimic de afișat.',
  children,
}: WidgetCardProps) => (
  <section className={styles.card} aria-label={title}>
    <header className={styles.header}>
      <div className={styles.titleGroup}>
        <h5 className={styles.title}>{title}</h5>
        {count !== undefined && <span className={styles.count}>{count}</span>}
      </div>
      {linkTo && <Link to={linkTo} className={styles.link}>{linkLabel}</Link>}
    </header>
    <div className={styles.body}>
      {isEmpty ? <p className={styles.empty}>{emptyText}</p> : children}
    </div>
  </section>
)
