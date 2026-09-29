import type { ReactNode } from 'react'
import styles from '../../pages/ConsultationsListPage.module.scss'

interface SectionPanelProps {
  icon: ReactNode
  title: string
  /** Mesajul afișat când secțiunea cere o consultație deja salvată */
  unavailableMessage: string
  children?: ReactNode
}

/** Tab-urile ale căror date se salvează independent (investigații, analize, servicii). */
export const SectionPanel = ({ icon, title, unavailableMessage, children }: SectionPanelProps) => (
  <div className={styles.formSection}>
    <h3 className={styles.sectionTitle}>
      <span className={styles.sectionIcon}>{icon}</span>
      {title}
    </h3>
    {children ?? (
      <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>{unavailableMessage}</p>
    )}
  </div>
)
