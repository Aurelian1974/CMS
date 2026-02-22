import { useNavigate } from 'react-router-dom';
import styles from './PageHeader.module.scss';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: boolean | (() => void);  // true = go(-1), funcție = custom handler
  actions?: React.ReactNode;
}

const IconArrowLeft = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

export const PageHeader = ({ title, subtitle, onBack, actions }: PageHeaderProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (typeof onBack === 'function') onBack();
    else navigate(-1);
  };

  return (
    <div className={styles.header}>
      <div className={styles.left}>
        {onBack && (
          <button className={styles.backBtn} onClick={handleBack} aria-label="Înapoi">
            <IconArrowLeft />
          </button>
        )}
        <div className={styles.titles}>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </div>
  );
};
