import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Stethoscope,
  ClipboardList,
  Receipt,
  UserCheck,
  HeartPulse,
  Building2,
  UserCog,
  BookOpen,
  GraduationCap,
  Hospital,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  LogOut,
  Clock,
  Pill,
} from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useHasAccess, type ModuleCode } from '@/hooks/useHasAccess';
import { authApi } from '@/api/endpoints/auth.api';
import styles from './Sidebar.module.scss';

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

const ICON_SIZE = 17;
const ICON_STROKE = 1.75;

const NAV_SECTIONS: NavSection[] = [
  {
    section: 'Principal',
    items: [
      { to: '/dashboard',     label: 'Dashboard',     icon: <LayoutDashboard size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'dashboard' },
      { to: '/patients',      label: 'Pacienți',      icon: <Users           size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'patients' },
      { to: '/appointments',  label: 'Programări',    icon: <CalendarDays    size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'appointments' },
      { to: '/consultations', label: 'Consultații',   icon: <Stethoscope     size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'consultations' },
      { to: '/prescriptions', label: 'Prescripții',   icon: <ClipboardList   size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'prescriptions' },
    ],
  },
  {
    section: 'Financiar',
    items: [
      { to: '/invoices', label: 'Facturi', icon: <Receipt size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'invoices' },
    ],
  },
  {
    section: 'Administrare',
    items: [
      { to: '/doctors',             label: 'Doctori',              icon: <UserCheck     size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'users' },
      { to: '/medical-staff',       label: 'Personal Medical',     icon: <HeartPulse   size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'users' },
      { to: '/departments',         label: 'Departamente',         icon: <Building2     size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'clinic' },
      { to: '/users',               label: 'Utilizatori',          icon: <UserCog       size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'users' },
      { to: '/specialties',         label: 'Specializări',         icon: <BookOpen      size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'nomenclature' },
      { to: '/medical-titles',      label: 'Titulaturi',           icon: <GraduationCap size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'nomenclature' },
      { to: '/clinic',              label: 'Clinica',              icon: <Hospital      size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'clinic' },
      { to: '/schedule',            label: 'Program',              icon: <Clock         size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'clinic' },
      { to: '/permissions/roles',   label: 'Permisiuni Roluri',    icon: <ShieldCheck   size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'users' },
      { to: '/permissions/users',   label: 'Override Utilizatori', icon: <ShieldAlert   size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'users' },
    ],
  },
  {
    section: 'Nomenclatoare',
    items: [
      { to: '/medicamente', label: 'Medicamente', icon: <Pill size={ICON_SIZE} strokeWidth={ICON_STROKE} />, module: 'anm' },
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

      {/* Versiune aplicație */}
      <div className={styles.versionBadge}>v{__APP_VERSION__}</div>

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
          <LogOut size={16} strokeWidth={1.8} />
        </button>
      </div>

      {/* Buton collapse/expand */}
      <button
        className={`${styles.collapseBtn}${sidebarCollapsed ? ` ${styles.rotated}` : ''}`}
        onClick={toggleSidebar}
        aria-label={sidebarCollapsed ? 'Extinde sidebar' : 'Restrânge sidebar'}
      >
        <ChevronLeft size={13} strokeWidth={2.5} />
      </button>

    </aside>
  );
};

export default Sidebar;

