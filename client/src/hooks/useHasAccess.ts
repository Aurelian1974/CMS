import { useCallback, useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';

/// Niveluri de acces — trebuie să corespundă cu backend-ul (AccessLevel enum).
export const ACCESS_LEVEL = {
  None: 0,
  Read: 1,
  Write: 2,
  Full: 3,
} as const;

export type AccessLevelValue = (typeof ACCESS_LEVEL)[keyof typeof ACCESS_LEVEL];

/// Coduri module — identice cu ModuleCodes din backend.
export const MODULE = {
  Dashboard: 'dashboard',
  Patients: 'patients',
  Appointments: 'appointments',
  Consultations: 'consultations',
  Prescriptions: 'prescriptions',
  Documents: 'documents',
  Invoices: 'invoices',
  Payments: 'payments',
  Reports: 'reports',
  Nomenclature: 'nomenclature',
  Users: 'users',
  Clinic: 'clinic',
  Cnas: 'cnas',
} as const;

export type ModuleCode = (typeof MODULE)[keyof typeof MODULE];

/**
 * Hook care verifică dacă utilizatorul curent are acces la un modul la un nivel minim.
 *
 * Returnează:
 *  - `hasAccess(module, requiredLevel)` — returnează `true` dacă nivelul efectiv >= cerut
 *  - `getLevel(module)` — returnează nivelul numeric efectiv (0-3)
 *  - `canRead(module)` / `canWrite(module)` / `hasFull(module)` — shorthand-uri
 */
export const useHasAccess = () => {
  const permissions = useAuthStore((s) => s.permissions);

  /// Mapă module→nivel pentru căutare O(1).
  const permMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of permissions) {
      map.set(p.module, p.level);
    }
    return map;
  }, [permissions]);

  const getLevel = useCallback(
    (module: ModuleCode): number => permMap.get(module) ?? ACCESS_LEVEL.None,
    [permMap],
  );

  const hasAccess = useCallback(
    (module: ModuleCode, requiredLevel: AccessLevelValue): boolean =>
      getLevel(module) >= requiredLevel,
    [getLevel],
  );

  const canRead = useCallback(
    (module: ModuleCode) => hasAccess(module, ACCESS_LEVEL.Read),
    [hasAccess],
  );

  const canWrite = useCallback(
    (module: ModuleCode) => hasAccess(module, ACCESS_LEVEL.Write),
    [hasAccess],
  );

  const hasFull = useCallback(
    (module: ModuleCode) => hasAccess(module, ACCESS_LEVEL.Full),
    [hasAccess],
  );

  return { hasAccess, getLevel, canRead, canWrite, hasFull };
};
