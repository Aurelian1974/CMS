import { NavLink, useNavigate } from 'react-router-dom';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useHasAccess, ACCESS_LEVEL, type ModuleCode } from '@/hooks/useHasAccess';
import { authApi } from '@/api/endpoints/auth.api';
import styles from './Sidebar.module.scss';

// ===== Icoane SVG inline pentru navigare (nu depind de librării externe) =====

const IconDashboard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconPatients = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const IconAppointments = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    <path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
  </svg>
);

const IconConsultations = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

const IconPrescriptions = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

const IconInvoices = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
  </svg>
);

const IconDoctors = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a5 5 0 015 5v1a5 5 0 01-10 0V7a5 5 0 015-5z" />
    <path d="M2 21v-1a7 7 0 0114 0v1" /><circle cx="19" cy="17" r="3" />
    <line x1="19" y1="15" x2="19" y2="19" /><line x1="17" y1="17" x2="21" y2="17" />
  </svg>
);

const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4" /><path d="M4 20v-1a8 8 0 0116 0v1" />
    <path d="M16 3.13a4 4 0 010 7.75" />
  </svg>
);

const IconSpecialties = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
    <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
  </svg>
);

const IconClinic = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4" y="2" width="16" height="20" rx="2" /><line x1="9" y1="22" x2="9" y2="2" />
    <line x1="15" y1="22" x2="15" y2="2" /><line x1="4" y1="12" x2="20" y2="12" />
    <line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="17" x2="20" y2="17" />
  </svg>
);

const IconDepartments = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
    <line x1="12" y1="12" x2="12" y2="16" />
    <line x1="10" y1="14" x2="14" y2="14" />
  </svg>
);

const IconMedicalTitles = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7V4a2 2 0 012-2h8.5L20 7.5V20a2 2 0 01-2 2H6a2 2 0 01-2-2v-3" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="1" y1="13" x2="11" y2="13" />
    <line x1="6" y1="10" x2="6" y2="16" />
  </svg>
);

const IconChevron = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

const IconLogout = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

const IconPermissions = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);

const RedCrossIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9" y="2" width="6" height="20" fill="#CC2936" rx="1.2" />
    <rect x="2" y="9" width="20" height="6" fill="#CC2936" rx="1.2" />
  </svg>
);

// ===== Configurare meniu navigare =====
interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  /** Modulul RBAC asociat — elementul se afișează doar dacă user-ul are cel puțin Read. */
  module?: ModuleCode;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    section: 'Principal',
    items: [
      { to: '/dashboard',     label: 'Dashboard',     icon: <IconDashboard />,     module: 'dashboard' },
      { to: '/patients',      label: 'Pacienți',      icon: <IconPatients />,      module: 'patients' },
      { to: '/appointments',  label: 'Programări',    icon: <IconAppointments />,  module: 'appointments' },
      { to: '/consultations', label: 'Consultații',   icon: <IconConsultations />, module: 'consultations' },
      { to: '/prescriptions', label: 'Prescripții',   icon: <IconPrescriptions />, module: 'prescriptions' },
    ],
  },
  {
    section: 'Financiar',
    items: [
      { to: '/invoices', label: 'Facturi', icon: <IconInvoices />, module: 'invoices' },
    ],
  },
  {
    section: 'Administrare',
    items: [
      { to: '/doctors',        label: 'Doctori',         icon: <IconDoctors />,       module: 'users' },
      { to: '/medical-staff',  label: 'Personal Medical', icon: <IconPatients />,      module: 'users' },
      { to: '/departments',    label: 'Departamente',    icon: <IconDepartments />,   module: 'clinic' },
      { to: '/users',          label: 'Utilizatori',     icon: <IconUsers />,         module: 'users' },
      { to: '/specialties',    label: 'Specializări',    icon: <IconSpecialties />,   module: 'nomenclature' },
      { to: '/medical-titles', label: 'Titulaturi',      icon: <IconMedicalTitles />, module: 'nomenclature' },
      { to: '/clinic',              label: 'Clinica',              icon: <IconClinic />,        module: 'clinic' },
      { to: '/permissions/roles',  label: 'Permisiuni Roluri',    icon: <IconPermissions />,   module: 'users' },
      { to: '/permissions/users',  label: 'Override Utilizatori', icon: <IconPermissions />,   module: 'users' },
    ],
  },
];

// ===== Extrage inițialele pentru avatar =====
const getInitials = (name: string): string => {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

// ===== Componenta Sidebar =====
export const Sidebar = () => {
  const { sidebarCollapsed, toggleSidebar } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const { canRead } = useHasAccess();

  const displayUser = user ?? { fullName: 'Utilizator', role: 'N/A' };

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignorăm erori la logout — oricum curățăm sesiunea local
    } finally {
      clearAuth();
      navigate('/login', { replace: true });
    }
  };

  /// Filtrează secțiunile de navigare — afișează doar elementele la care userul are cel puțin Read.
  /// Secțiunile goale (fără item-uri vizibile) sunt ascunse complet.
  const visibleSections = NAV_SECTIONS
    .map(({ section, items }) => ({
      section,
      items: items.filter((item) => !item.module || canRead(item.module)),
    }))
    .filter(({ items }) => items.length > 0);

  return (
    <aside className={`${styles.sidebar}${sidebarCollapsed ? ` ${styles.collapsed}` : ''}`}>

      {/* Brand */}
      <NavLink to="/dashboard" className={styles.brand}>
        <div className={styles.brandIcon}>
          <RedCrossIcon />
        </div>
        <span className={styles.brandName}>
          Valyan<span>Clinic</span>
        </span>
      </NavLink>

      {/* Navigare — filtrat pe baza permisiunilor */}
      <nav className={styles.nav}>
        {visibleSections.map(({ section, items }) => (
          <div key={section} className={styles.navGroup}>
            <div className={styles.sectionLabel}>{section}</div>
            {items.map(({ to, label, icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `${styles.navItem}${isActive ? ` ${styles.active}` : ''}`
                }
              >
                <span className={styles.navIcon}>{icon}</span>
                <span className={styles.navLabel}>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bloc utilizator */}
      <div className={styles.userBlock}>
        <div className={styles.avatar}>
          {getInitials(displayUser.fullName)}
        </div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>{displayUser.fullName}</div>
          <div className={styles.userRole}>{displayUser.role}</div>
        </div>
        <button
          className={styles.logoutBtn}
          onClick={handleLogout}
          aria-label="Deconectare"
          title="Deconectare"
        >
          <IconLogout />
        </button>
      </div>

      {/* Buton collapse/expand */}
      <button
        className={`${styles.collapseBtn}${sidebarCollapsed ? ` ${styles.rotated}` : ''}`}
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Extinde sidebar' : 'Restrânge sidebar'}
      >
        <IconChevron />
      </button>

    </aside>
  );
};

export default Sidebar;
