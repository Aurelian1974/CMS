import { Link, useLocation } from 'react-router-dom';
import styles from './AppBreadcrumb.module.scss';

// Mapare segmente URL → etichete lizibile
const SEGMENT_LABELS: Record<string, string> = {
  'dashboard':     'Dashboard',
  'patients':      'Pacienți',
  'appointments':  'Programări',
  'consultations': 'Consultații',
  'prescriptions': 'Prescripții',
  'invoices':      'Facturi',
  'doctors':       'Doctori',
  'medical-staff': 'Personal Medical',
  'users':         'Utilizatori',
  'new':           'Nou',
  'edit':          'Editare',
};

interface BreadcrumbItem {
  label: string;
  path: string;
}

/** Transformă pathname-ul în lista de breadcrumbs, sărind segmentele UUID */
const buildCrumbs = (pathname: string): BreadcrumbItem[] => {
  // Regex UUID v4 + NEWSEQUENTIALID (format GUID)
  const uuidRe = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  const segments = pathname.split('/').filter(Boolean);
  const crumbs: BreadcrumbItem[] = [{ label: 'Acasă', path: '/dashboard' }];

  let accPath = '';
  for (const [i, seg] of segments.entries()) {
    accPath += `/${seg}`;
    if (uuidRe.test(seg)) {
      // ID dinamic — eticheta e determinată de segmentul anterior (ex: patients → Detalii pacient)
      const prev = segments[i - 1];
      const detailLabels: Record<string, string> = {
        patients:      'Detalii pacient',
        appointments:  'Detalii programare',
        consultations: 'Detalii consultație',
        prescriptions: 'Detalii prescripție',
        invoices:      'Detalii factură',
        doctors:       'Detalii doctor',
        users:         'Detalii utilizator',
      };
      crumbs.push({ label: detailLabels[prev] ?? 'Detalii', path: accPath });
    } else {
      const label = SEGMENT_LABELS[seg];
      if (label) crumbs.push({ label, path: accPath });
    }
  }

  return crumbs;
};

export const AppBreadcrumb = () => {
  const { pathname } = useLocation();
  const crumbs = buildCrumbs(pathname);

  // Nu afișa breadcrumbs pe dashboard (ar arăta: Acasă > Dashboard — redundant)
  if (pathname === '/dashboard' || crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className={styles.breadcrumb}>
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li key={crumb.path} className={styles.item}>
              {idx > 0 && <span className={styles.separator} aria-hidden="true">/</span>}
              {isLast ? (
                <span className={styles.current} aria-current="page">{crumb.label}</span>
              ) : (
                <Link className={styles.link} to={crumb.path}>{crumb.label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
