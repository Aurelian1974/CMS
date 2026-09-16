import { useCallback, useMemo } from 'react';
import { matchPath } from 'react-router-dom';
import { useHasAccess, type ModuleCode } from '@/hooks/useHasAccess';

/**
 * Sursa unică pentru „ce module RBAC cere fiecare ecran".
 *
 * Consumată în trei locuri, ca să nu existe două definiții care se pot desincroniza:
 *  - `Sidebar` — ce item-uri de meniu se afișează;
 *  - `RequireModuleAccess` — ce rute se pot deschide direct din bara de adrese;
 *  - `useLandingRoute` — unde aterizează un utilizator fără `dashboard`.
 *
 * Semantica listei e **AND**: ecranul cere Read pe *toate* modulele enumerate.
 * O pagină care citește din două nomenclatoare e inutilizabilă fără unul dintre ele
 * (vezi `/medicamente`, care apelează și ANM, și CNAS).
 *
 * **Ordinea contează**: `useLandingRoute` întoarce prima rută permisă, deci cheile
 * sunt scrise în aceeași ordine ca secțiunile din sidebar.
 *
 * Potrivirea rutei se face cu prefix (`end: false`), deci `/patients` acoperă și
 * `/patients/new`, și `/patients/:id/edit`. Când se potrivesc mai multe tipare,
 * câștigă cel mai specific — `/cnas/drugs` înaintea unui eventual `/cnas`.
 */
export const ROUTE_MODULES = {
  // Principal
  '/dashboard':       ['dashboard'],
  '/patients':        ['patients'],
  '/appointments':    ['appointments'],
  '/consultations':   ['consultations'],
  '/prescriptions':   ['prescriptions'],

  // Financiar
  '/invoices':        ['invoices'],

  // Administrare
  '/doctors':           ['users'],
  '/medical-staff':     ['users'],
  '/departments':       ['clinic'],
  '/users':             ['users'],
  '/specialties':       ['nomenclature'],
  '/medical-titles':    ['nomenclature'],
  '/clinic':            ['clinic'],
  '/schedule':          ['clinic'],
  '/permissions/roles': ['users'],
  '/permissions/users': ['users'],
  '/settings/security': ['settings'],
  '/audit/security':    ['audit'],

  // Nomenclatoare
  '/medicamente':           ['anm', 'cnas'],
  '/anm/drugs':             ['anm'],
  '/cnas/drugs':            ['cnas'],
  '/cnas/compensated':      ['cnas'],
  '/cnas/active-substances':['cnas'],
  '/cnas/atc':              ['cnas'],
  '/cnas/icd10':            ['cnas'],
} as const satisfies Record<string, readonly ModuleCode[]>;

export type GuardedRoute = keyof typeof ROUTE_MODULES;

const GUARDED_ROUTES = Object.keys(ROUTE_MODULES) as GuardedRoute[];

/**
 * Modulele cerute de o cale concretă, sau `null` dacă ruta nu e păzită.
 * O rută nemapată rămâne deschisă — backend-ul o protejează oricum cu `[HasAccess]`,
 * iar o listă incompletă nu trebuie să blocheze ecrane care funcționau.
 */
export function modulesForPath(pathname: string): readonly ModuleCode[] | null {
  let best: GuardedRoute | null = null;

  for (const route of GUARDED_ROUTES) {
    if (!matchPath({ path: route, end: false }, pathname)) continue;
    // Cel mai specific tipar câștigă: `/permissions/roles` înaintea lui `/permissions`.
    if (best === null || route.length > best.length) best = route;
  }

  return best === null ? null : ROUTE_MODULES[best];
}

/**
 * Prima rută pe care utilizatorul curent o poate deschide, în ordinea din meniu.
 * `null` înseamnă că nu are acces la niciun ecran — contul n-are niciun modul alocat.
 */
export function useLandingRoute(): GuardedRoute | null {
  const { canRead } = useHasAccess();

  return useMemo(
    () => GUARDED_ROUTES.find((route) => ROUTE_MODULES[route].every((m) => canRead(m))) ?? null,
    [canRead],
  );
}

/** `true` dacă utilizatorul curent are Read pe toate modulele cerute de calea dată. */
export function useCanOpenPath(): (pathname: string) => boolean {
  const { canRead } = useHasAccess();

  return useCallback(
    (pathname: string) => {
      const required = modulesForPath(pathname);
      return required === null || required.every((m) => canRead(m));
    },
    [canRead],
  );
}
