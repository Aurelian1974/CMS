import type { ReactNode } from 'react';
import { useHasAccess, type AccessLevelValue, type ModuleCode, ACCESS_LEVEL } from '@/hooks/useHasAccess';

interface PermissionGateProps {
  /** Codul modulului verificat (ex: 'patients', 'invoices'). */
  module: ModuleCode;
  /** Nivelul minim de acces necesar. Default: Read (1). */
  level?: AccessLevelValue;
  /** Conținut afișat dacă utilizatorul NU are acces. Default: null (ascunde). */
  fallback?: ReactNode;
  children: ReactNode;
}

/**
 * Componentă-gard care afișează conținutul doar dacă utilizatorul
 * are nivelul minim de acces pe modulul specificat.
 *
 * Exemplu:
 * ```tsx
 * <PermissionGate module="patients" level={ACCESS_LEVEL.Write}>
 *   <AppButton>Adaugă Pacient</AppButton>
 * </PermissionGate>
 * ```
 */
export const PermissionGate = ({
  module,
  level = ACCESS_LEVEL.Read,
  fallback = null,
  children,
}: PermissionGateProps) => {
  const { hasAccess } = useHasAccess();
  return hasAccess(module, level) ? <>{children}</> : <>{fallback}</>;
};
