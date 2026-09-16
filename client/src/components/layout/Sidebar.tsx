import { useEffect, useMemo, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
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
  SlidersHorizontal,
  ScrollText,
  ChevronLeft,
  ChevronDown,
  KeyRound,
  LogOut,
  Clock,
  Pill,
  Tablets,
  Package,
  Percent,
  FlaskConical,
  Network,
  Activity,
  Search,
  X,
} from 'lucide-react';
import { useUiStore } from '@/store/uiStore';
import { useAuthStore } from '@/store/authStore';
import { useHasAccess } from '@/hooks/useHasAccess';
import { ROUTE_MODULES, useLandingRoute, type GuardedRoute } from '@/routes/moduleAccess';
import { authApi } from '@/api/endpoints/auth.api';
import styles from './Sidebar.module.scss';

const MOBILE_BREAKPOINT = 768;

const RedCrossIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
    <rect x="9" y="2" width="6" height="20" fill="#CC2936" rx="1.2" />
    <rect x="2" y="9" width="20" height="6" fill="#CC2936" rx="1.2" />
  </svg>
);

// ===== Configurare meniu navigare =====
/**
 * Un item de meniu nu-și declară singur permisiunile: le ia din `ROUTE_MODULES`,
 * aceeași hartă folosită de garda de rută. Așa meniul și garda nu se pot desincroniza,
 * iar `to` e tipizat — o rută inexistentă în hartă e eroare de compilare, nu un item
 * care apare tuturor.
 */
interface NavItem {
  to: GuardedRoute;
  label: string;
  icon: React.ReactNode;
}

interface NavSection {
  section: string;
  items: NavItem[];
}

// NOTĂ: ICON_SIZE trebuie să coincidă cu $icon-size din Sidebar.module.scss
const ICON_SIZE = 17;
const ICON_STROKE = 1.75;

const NAV_SECTIONS: NavSection[] = [
  {
    section: 'Principal',
    items: [
      { to: '/dashboard',     label: 'Dashboard',     icon: <LayoutDashboard size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/patients',      label: 'Pacienți',      icon: <Users           size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/appointments',  label: 'Programări',    icon: <CalendarDays    size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/consultations', label: 'Consultații',   icon: <Stethoscope     size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/prescriptions', label: 'Prescripții',   icon: <ClipboardList   size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
    ],
  },
  {
    section: 'Financiar',
    items: [
      { to: '/invoices', label: 'Facturi', icon: <Receipt size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
    ],
  },
  {
    section: 'Administrare',
    items: [
      { to: '/doctors',             label: 'Doctori',              icon: <UserCheck     size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/medical-staff',       label: 'Personal Medical',     icon: <HeartPulse   size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/departments',         label: 'Departamente',         icon: <Building2     size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/users',               label: 'Utilizatori',          icon: <UserCog       size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/specialties',         label: 'Specializări',         icon: <BookOpen      size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/medical-titles',      label: 'Titulaturi',           icon: <GraduationCap size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/clinic',              label: 'Clinica',              icon: <Hospital      size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/schedule',            label: 'Program',              icon: <Clock         size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/permissions/roles',   label: 'Permisiuni Roluri',    icon: <ShieldCheck   size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/permissions/users',   label: 'Override Utilizatori', icon: <ShieldAlert   size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/settings/security',   label: 'Setări securitate',    icon: <SlidersHorizontal size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/audit/security',      label: 'Jurnal securitate',    icon: <ScrollText    size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
    ],
  },
  {
    section: 'Nomenclatoare',
    items: [
      { to: '/medicamente',           label: 'Medicamente',        icon: <Pill         size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/anm/drugs',             label: 'Medicamente ANM',    icon: <Tablets      size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/cnas/drugs',            label: 'Medicamente CNAS',   icon: <Package      size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/cnas/compensated',      label: 'Liste compensate',   icon: <Percent      size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/cnas/active-substances',label: 'Substanțe active',   icon: <FlaskConical size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/cnas/atc',              label: 'Clasificare ATC',    icon: <Network      size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
      { to: '/cnas/icd10',            label: 'Diagnostice ICD-10', icon: <Activity     size={ICON_SIZE} strokeWidth={ICON_STROKE} /> },
    ],
  },
];

// ===== Extrage inițialele pentru avatar =====
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return name.substring(0, 2).toUpperCase();
};

// ===== Componenta Sidebar =====
export const Sidebar = () => {
  const sidebarCollapsed = useUiStore((s) => s.sidebarCollapsed);
  const setSidebarCollapsed = useUiStore((s) => s.setSidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const openOwnPasswordModal = useUiStore((s) => s.openOwnPasswordModal);
  const menuSearchQuery = useUiStore((s) => s.menuSearchQuery);
  const setMenuSearchQuery = useUiStore((s) => s.setMenuSearchQuery);
  const collapsedSections = useUiStore((s) => s.collapsedSections);
  const toggleSection = useUiStore((s) => s.toggleSection);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const location = useLocation();
  const { canRead } = useHasAccess();
  const landing = useLandingRoute();
  const activeLinkRef = useRef<HTMLAnchorElement | null>(null);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT;

  const displayUser = user ?? { fullName: 'Utilizator', role: 'N/A' };

  // Sub lg: auto-collapse la prima montare; pe mobil începe închis.
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < MOBILE_BREAKPOINT;
      const tabletDesktopCollapsed = window.innerWidth < 992;
      if (mobile) {
        setSidebarCollapsed(true);
      } else if (tabletDesktopCollapsed) {
        setSidebarCollapsed(true);
      }
      // La desktop mare (>992) nu forțăm — persistă starea utilizatorului.
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarCollapsed]);

  // Pe mobil, închide sidebar-ul la navigare.
  useEffect(() => {
    if (isMobile && !sidebarCollapsed) {
      setSidebarCollapsed(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Scroll item activ în viewport la montare (util pe ecrane mici).
  useEffect(() => {
    if (activeLinkRef.current?.scrollIntoView) {
      activeLinkRef.current.scrollIntoView({ block: 'nearest' });
    }
  }, []);

  // Închide sidebar la Escape (doar pe mobil sau când e deschis).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !sidebarCollapsed) {
        setSidebarCollapsed(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarCollapsed, setSidebarCollapsed]);

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

  /// Filtrează secțiunile de navigare — afișează doar elementele la care userul are
  /// cel puțin Read pe toate modulele de care depinde pagina și care se potrivesc
  /// căutării curente (după label sau nume secțiune).
  /// Secțiunile goale (fără item-uri vizibile) sunt ascunse complet.
  const visibleSections = useMemo(() => {
    const query = menuSearchQuery.trim().toLowerCase();
    return NAV_SECTIONS
      .map(({ section, items }) => ({
        section,
        items: items.filter((item) => {
          if (!ROUTE_MODULES[item.to].every((m) => canRead(m))) return false;
          if (!query) return true;
          return (
            item.label.toLowerCase().includes(query) ||
            section.toLowerCase().includes(query)
          );
        }),
      }))
      .filter(({ items }) => items.length > 0);
  }, [canRead, menuSearchQuery]);

  const isMobileOpen = isMobile && !sidebarCollapsed;

  return (
    <>
      {isMobileOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setSidebarCollapsed(true)}
          aria-hidden="true"
        />
      )}
      <aside
        className={`${styles.sidebar}${sidebarCollapsed ? ` ${styles.collapsed}` : ''}${isMobile && sidebarCollapsed ? ` ${styles.closed}` : ''}`}
      >

      {/* Brand + buton collapse — ancorare predictibilă, fără suprapunere peste conținut */}
      <div className={styles.brandArea}>
        <NavLink to={landing ?? '/dashboard'} className={styles.brand}>
          <div className={styles.brandIcon}>
            <RedCrossIcon />
          </div>
          <span className={styles.brandName}>
            Valyan<span>Clinic</span>
          </span>
        </NavLink>
        <button
          type="button"
          className={`${styles.collapseBtn}${sidebarCollapsed ? ` ${styles.rotated}` : ''}`}
          onClick={toggleSidebar}
          aria-expanded={!sidebarCollapsed}
          aria-controls="main-navigation"
          aria-label={sidebarCollapsed ? 'Extinde sidebar' : 'Restrânge sidebar'}
          title={sidebarCollapsed ? 'Extinde sidebar' : 'Restrânge sidebar'}
        >
          <ChevronLeft size={14} strokeWidth={2.5} />
        </button>
      </div>

      {/* Căutare în meniu — ascunsă când sidebar-ul e restrâns */}
      {!sidebarCollapsed && (
        <div className={styles.searchBox}>
          <Search size={14} strokeWidth={2} className={styles.searchIcon} />
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Caută în meniu..."
            value={menuSearchQuery}
            onChange={(e) => setMenuSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setMenuSearchQuery('');
              }
            }}
            aria-label="Caută în meniu"
          />
          {menuSearchQuery && (
            <button
              type="button"
              className={styles.searchClear}
              onClick={() => setMenuSearchQuery('')}
              aria-label="Șterge căutarea"
              title="Șterge căutarea"
            >
              <X size={14} strokeWidth={2} />
            </button>
          )}
        </div>
      )}

      {/* Navigare — filtrat pe baza permisiunilor */}
      <nav id="main-navigation" className={styles.nav} aria-label="Navigare principală">
        {visibleSections.map(({ section, items }) => {
          const sectionId = `nav-section-${section}`;
          const itemsId = `nav-items-${section}`;
          // Când există o căutare activă sau sidebar-ul e restrâns la iconițe,
          // secțiunea rămâne mereu extinsă — altfel rezultatele filtrate sau
          // iconițele ar putea fi ascunse de o restrângere anterioară.
          const isSearching = menuSearchQuery.trim().length > 0;
          const isExpanded = isSearching || sidebarCollapsed || !collapsedSections.includes(section);
          return (
            <div
              key={section}
              className={styles.navGroup}
              role="group"
              aria-labelledby={sectionId}
            >
              <button
                type="button"
                id={sectionId}
                className={styles.sectionHeader}
                onClick={() => toggleSection(section)}
                aria-expanded={isExpanded}
                aria-controls={itemsId}
                disabled={isSearching}
              >
                <span className={styles.sectionLabel}>{section}</span>
                <ChevronDown
                  size={13}
                  strokeWidth={2}
                  className={`${styles.sectionChevron}${isExpanded ? ` ${styles.expanded}` : ''}`}
                />
              </button>
              <div
                id={itemsId}
                className={`${styles.itemsWrapper}${isExpanded ? ` ${styles.expanded}` : ''}`}
              >
                {items.map(({ to, label, icon }) => (
                  <NavLink
                    key={to}
                    to={to}
                    ref={(node) => {
                      if (node?.classList.contains(styles.active)) {
                        activeLinkRef.current = node;
                      }
                    }}
                    className={({ isActive }) =>
                      `${styles.navItem}${isActive ? ` ${styles.active}` : ''}`
                    }
                    title={sidebarCollapsed ? label : undefined}
                  >
                    <span className={styles.navIcon}>{icon}</span>
                    <span className={styles.navLabel}>{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          );
        })}
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
          type="button"
          className={styles.iconBtn}
          onClick={openOwnPasswordModal}
          aria-label="Schimbă parola"
          title="Schimbă parola"
        >
          <KeyRound size={16} strokeWidth={1.8} />
        </button>
        <button
          type="button"
          className={`${styles.iconBtn} ${styles.danger}`}
          onClick={handleLogout}
          aria-label="Deconectare"
          title="Deconectare"
        >
          <LogOut size={16} strokeWidth={1.8} />
        </button>
      </div>

      </aside>
    </>
  );
};

export default Sidebar;

