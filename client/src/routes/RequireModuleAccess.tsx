import { Outlet, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useHasAccess } from '@/hooks/useHasAccess';
import { modulesForPath, useLandingRoute } from './moduleAccess';
import { AccessDeniedScreen, NoModulesScreen } from './AccessScreens';

/**
 * Gardă de rută pe modul, montată o singură dată ca layout în interiorul
 * `MainLayout`. Calea curentă e căutată în `ROUTE_MODULES`, deci nu e nevoie de
 * nimic per-rută în `AppRoutes` — o rută nouă e păzită din clipa în care apare
 * în hartă.
 *
 * Sidebar-ul filtra deja meniul, dar era doar cosmetic: cine tasta adresa în bară
 * ajungea pe pagină, care se umplea de 403-uri. Backend-ul a refuzat corect tot
 * timpul — asta e strict despre ce vede utilizatorul.
 */
export const RequireModuleAccess = () => {
  const { pathname } = useLocation();
  const { canRead } = useHasAccess();

  const required = modulesForPath(pathname);
  if (required === null) return <Outlet />;

  return required.every((m) => canRead(m))
    ? <Outlet />
    : <AccessDeniedScreen modules={required} />;
};

/**
 * Destinația pentru `index` și pentru rutele necunoscute.
 *
 * Trimitea până acum fix la `/dashboard`, inclusiv utilizatorii care n-au modulul
 * `dashboard` — aterizau exact pe ecranul interzis, iar `*` îi readucea acolo la
 * fiecare încercare. Acum destinația e primul ecran permis, în ordinea din meniu.
 */
export const LandingRedirect = () => {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const landing = useLandingRoute();

  // Cât timp sesiunea se reconstruiește din cookie-ul de refresh nu știm încă nici
  // dacă e autentificat, nici ce permisiuni are — un redirect acum ar fi greșit.
  if (isBootstrapping) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (landing === null) return <NoModulesScreen />;

  return <Navigate to={landing} replace />;
};
