import { useLocation } from 'react-router-dom';
import { formatDate } from '@/utils/format';
import { AppBreadcrumb } from './AppBreadcrumb';
import styles from './AppHeader.module.scss';

// Mapare rute → titluri
const ROUTE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/patients':      'Pacienți',
  '/appointments':  'Programări',
  '/consultations': 'Consultații',
  '/prescriptions': 'Prescripții',
  '/invoices':      'Facturi',
  '/doctors':       'Doctori',
  '/users':         'Utilizatori',
};

const IconBell = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 01-3.46 0" />
  </svg>
);

const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

export const AppHeader = () => {
  const location = useLocation();

  // Determinare titlu din ruta curentă
  const baseRoute = '/' + location.pathname.split('/')[1];
  const pageTitle = ROUTE_TITLES[baseRoute] ?? 'ValyanClinic';

  const today = formatDate(new Date());

  return (
    <header className={styles.header}>
      <div className={styles.left}>
        {/* Pe dashboard afișăm titlul simplu; pe celelalte rute — breadcrumbs */}
        {location.pathname === '/dashboard' ? (
          <span className={styles.pageTitle}>{pageTitle}</span>
        ) : (
          <AppBreadcrumb />
        )}
      </div>

      <div className={styles.right}>
        <span className={styles.dateInfo}>{today}</span>

        <div className={styles.divider} />

        {/* Notificări */}
        <button className={styles.headerBtn} aria-label="Notificări">
          <IconBell />
          <span className={styles.badge} />
        </button>

        {/* Setări */}
        <button className={styles.headerBtn} aria-label="Setări">
          <IconSettings />
        </button>
      </div>
    </header>
  );
};

export default AppHeader;
