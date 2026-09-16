/**
 * Teste pentru sursa unică rută → module și pentru ruta de aterizare.
 *
 * ROUTE_MODULES e consumată de sidebar, de garda de rută și de redirect-ul de
 * aterizare — o greșeală aici se propagă în toate trei, deci merită acoperire.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { modulesForPath, useLandingRoute, ROUTE_MODULES } from '@/routes/moduleAccess';
import { useAuthStore } from '@/store/authStore';
import { ACCESS_LEVEL, MODULE, type ModuleCode } from '@/hooks/useHasAccess';

function grantRead(...modules: ModuleCode[]) {
  useAuthStore.setState({
    permissions: modules.map((module) => ({
      module,
      level: ACCESS_LEVEL.Read,
      isOverridden: false,
    })),
  });
}

afterEach(() => {
  useAuthStore.setState({ permissions: [] });
});

// ── modulesForPath ────────────────────────────────────────────────────────────

describe('modulesForPath', () => {
  it('întoarce modulul pentru o rută simplă', () => {
    expect(modulesForPath('/patients')).toEqual(['patients']);
  });

  it('acoperă și subrutele cu parametri', () => {
    expect(modulesForPath('/patients/new')).toEqual(['patients']);
    expect(modulesForPath('/patients/abc-123/edit')).toEqual(['patients']);
    expect(modulesForPath('/doctors/abc-123')).toEqual(['users']);
    expect(modulesForPath('/appointments/scheduler')).toEqual(['appointments']);
  });

  it('alege tiparul cel mai specific când mai multe se potrivesc', () => {
    expect(modulesForPath('/permissions/roles')).toEqual(['users']);
    expect(modulesForPath('/settings/security')).toEqual(['settings']);
    expect(modulesForPath('/audit/security')).toEqual(['audit']);
  });

  it('întoarce ambele module pentru o pagină care depinde de două', () => {
    expect(modulesForPath('/medicamente')).toEqual(['anm', 'cnas']);
  });

  it('întoarce null pentru o rută nemapată — ecranul rămâne deschis', () => {
    expect(modulesForPath('/o-ruta-inexistenta')).toBeNull();
    expect(modulesForPath('/login')).toBeNull();
  });

  it('acoperă toate ecranele CNAS/ANM, nu doar /medicamente', () => {
    for (const path of ['/cnas/drugs', '/cnas/compensated', '/cnas/active-substances',
                        '/cnas/atc', '/cnas/icd10']) {
      expect(modulesForPath(path)).toEqual(['cnas']);
    }
    expect(modulesForPath('/anm/drugs')).toEqual(['anm']);
  });
});

// ── useLandingRoute ───────────────────────────────────────────────────────────

describe('useLandingRoute', () => {
  beforeEach(() => grantRead());

  it('întoarce /dashboard când utilizatorul are modulul dashboard', () => {
    grantRead(MODULE.Dashboard, MODULE.Patients);
    const { result } = renderHook(() => useLandingRoute());
    expect(result.current).toBe('/dashboard');
  });

  it('sare peste dashboard când utilizatorul nu are acces la el', () => {
    grantRead(MODULE.Appointments);
    const { result } = renderHook(() => useLandingRoute());
    expect(result.current).toBe('/appointments');
  });

  it('respectă ordinea din meniu, nu ordinea permisiunilor primite', () => {
    grantRead(MODULE.Invoices, MODULE.Patients);
    const { result } = renderHook(() => useLandingRoute());
    expect(result.current).toBe('/patients');
  });

  it('nu propune o rută cu două module când userul are doar unul', () => {
    grantRead(MODULE.Anm);
    const { result } = renderHook(() => useLandingRoute());
    expect(result.current).toBe('/anm/drugs');
  });

  it('întoarce null când utilizatorul nu are niciun modul', () => {
    const { result } = renderHook(() => useLandingRoute());
    expect(result.current).toBeNull();
  });
});

// ── Coerență cu MODULE ────────────────────────────────────────────────────────

describe('ROUTE_MODULES', () => {
  it('folosește doar coduri de modul existente în MODULE', () => {
    const known = new Set<string>(Object.values(MODULE));
    for (const [route, modules] of Object.entries(ROUTE_MODULES)) {
      for (const m of modules) {
        expect(known, `ruta ${route} cere un modul necunoscut: ${m}`).toContain(m);
      }
    }
  });

  it('nu conține rute duplicate sau fără module', () => {
    for (const [route, modules] of Object.entries(ROUTE_MODULES)) {
      expect(modules.length, `ruta ${route} nu cere niciun modul`).toBeGreaterThan(0);
    }
  });
});
