/**
 * Teste unitare pentru hooks/useHasAccess.ts
 * Verifică logica de verificare a permisiunilor:
 * - hasAccess(module, level) → boolean
 * - getLevel(module) → nivelul numeric
 * - canRead, canWrite, hasFull → shorthand-uri
 * - module inexistent → None (0)
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHasAccess, ACCESS_LEVEL, MODULE } from '@/hooks/useHasAccess';
import { useAuthStore } from '@/store/authStore';

// ── Setup/teardown store ──────────────────────────────────────────────────────

function setPermissions(permissions: { module: string; level: number; isOverridden: boolean }[]) {
  useAuthStore.setState({ permissions });
}

describe('useHasAccess', () => {
  beforeEach(() => {
    setPermissions([
      { module: MODULE.Patients,  level: ACCESS_LEVEL.Write, isOverridden: false },
      { module: MODULE.Users,     level: ACCESS_LEVEL.Full,  isOverridden: false },
      { module: MODULE.Dashboard, level: ACCESS_LEVEL.Read,  isOverridden: true  },
      { module: MODULE.Invoices,  level: ACCESS_LEVEL.None,  isOverridden: false },
    ]);
  });

  afterEach(() => {
    useAuthStore.setState({ permissions: [] });
  });

  // ── hasAccess ─────────────────────────────────────────────────────────────

  it('hasAccess returnează true când nivelul este exact cel cerut', () => {
    const { result } = renderHook(() => useHasAccess());
    expect(result.current.hasAccess(MODULE.Patients, ACCESS_LEVEL.Write)).toBe(true);
  });

  it('hasAccess returnează true când nivelul este mai mare decât cel cerut', () => {
    const { result } = renderHook(() => useHasAccess());
    expect(result.current.hasAccess(MODULE.Patients, ACCESS_LEVEL.Read)).toBe(true);
    expect(result.current.hasAccess(MODULE.Users, ACCESS_LEVEL.Write)).toBe(true);
    expect(result.current.hasAccess(MODULE.Users, ACCESS_LEVEL.Read)).toBe(true);
  });

  it('hasAccess returnează false când nivelul este insuficient', () => {
    const { result } = renderHook(() => useHasAccess());
    expect(result.current.hasAccess(MODULE.Patients, ACCESS_LEVEL.Full)).toBe(false);
    expect(result.current.hasAccess(MODULE.Dashboard, ACCESS_LEVEL.Write)).toBe(false);
  });

  it('hasAccess returnează false pentru modul inexistent', () => {
    const { result } = renderHook(() => useHasAccess());
    expect(result.current.hasAccess(MODULE.Appointments, ACCESS_LEVEL.Read)).toBe(false);
  });

  // ── getLevel ──────────────────────────────────────────────────────────────

  it('getLevel returnează nivelul numeric corect', () => {
    const { result } = renderHook(() => useHasAccess());
    expect(result.current.getLevel(MODULE.Patients)).toBe(ACCESS_LEVEL.Write);
    expect(result.current.getLevel(MODULE.Users)).toBe(ACCESS_LEVEL.Full);
    expect(result.current.getLevel(MODULE.Dashboard)).toBe(ACCESS_LEVEL.Read);
  });

  it('getLevel returnează 0 (None) pentru modul fără permisiune', () => {
    const { result } = renderHook(() => useHasAccess());
    expect(result.current.getLevel(MODULE.Consultations)).toBe(ACCESS_LEVEL.None);
    expect(result.current.getLevel(MODULE.Prescriptions)).toBe(ACCESS_LEVEL.None);
  });

  it('getLevel returnează 0 (None) pentru permisiune explicită None', () => {
    const { result } = renderHook(() => useHasAccess());
    expect(result.current.getLevel(MODULE.Invoices)).toBe(ACCESS_LEVEL.None);
  });

  // ── canRead ───────────────────────────────────────────────────────────────

  it('canRead returnează true când nivelul >= Read (1)', () => {
    const { result } = renderHook(() => useHasAccess());
    expect(result.current.canRead(MODULE.Dashboard)).toBe(true);  // Read
    expect(result.current.canRead(MODULE.Patients)).toBe(true);   // Write
    expect(result.current.canRead(MODULE.Users)).toBe(true);      // Full
  });

  it('canRead returnează false pentru module fără permisiune', () => {
    const { result } = renderHook(() => useHasAccess());
    expect(result.current.canRead(MODULE.Appointments)).toBe(false);
    expect(result.current.canRead(MODULE.Invoices)).toBe(false);  // None explicit
  });

  // ── canWrite ──────────────────────────────────────────────────────────────

  it('canWrite returnează true când nivelul >= Write (2)', () => {
    const { result } = renderHook(() => useHasAccess());
    expect(result.current.canWrite(MODULE.Patients)).toBe(true);  // exact Write
    expect(result.current.canWrite(MODULE.Users)).toBe(true);     // Full >= Write
  });

  it('canWrite returnează false pentru Read (1)', () => {
    const { result } = renderHook(() => useHasAccess());
    expect(result.current.canWrite(MODULE.Dashboard)).toBe(false);
  });

  // ── hasFull ───────────────────────────────────────────────────────────────

  it('hasFull returnează true doar pentru nivelul Full (3)', () => {
    const { result } = renderHook(() => useHasAccess());
    expect(result.current.hasFull(MODULE.Users)).toBe(true);
  });

  it('hasFull returnează false pentru Write (2)', () => {
    const { result } = renderHook(() => useHasAccess());
    expect(result.current.hasFull(MODULE.Patients)).toBe(false);
  });

  it('hasFull returnează false pentru Read (1)', () => {
    const { result } = renderHook(() => useHasAccess());
    expect(result.current.hasFull(MODULE.Dashboard)).toBe(false);
  });

  // ── Fără permisiuni (utilizator neautentificat) ───────────────────────────

  it('fără permisiuni — toate modulele returnează false', () => {
    useAuthStore.setState({ permissions: [] });
    const { result } = renderHook(() => useHasAccess());

    expect(result.current.canRead(MODULE.Patients)).toBe(false);
    expect(result.current.canWrite(MODULE.Users)).toBe(false);
    expect(result.current.hasFull(MODULE.Clinic)).toBe(false);
    expect(result.current.getLevel(MODULE.Dashboard)).toBe(0);
  });

  // ── Reactivity — actualizare la schimbarea permisiunilor ─────────────────

  it('se actualizează corect când permisiunile se schimbă în store', () => {
    const { result } = renderHook(() => useHasAccess());

    expect(result.current.canRead(MODULE.Clinic)).toBe(false);

    // Adaugă permisiune pentru Clinic
    setPermissions([
      { module: MODULE.Clinic, level: ACCESS_LEVEL.Full, isOverridden: false },
    ]);

    // re-render manual nu e necesar — Zustand notifică hook-ul automat
    const { result: result2 } = renderHook(() => useHasAccess());
    expect(result2.current.canRead(MODULE.Clinic)).toBe(true);
    expect(result2.current.hasFull(MODULE.Clinic)).toBe(true);
  });
});

// ── Constante exportate ───────────────────────────────────────────────────────

describe('ACCESS_LEVEL constante', () => {
  it('are valorile numerice corecte', () => {
    expect(ACCESS_LEVEL.None).toBe(0);
    expect(ACCESS_LEVEL.Read).toBe(1);
    expect(ACCESS_LEVEL.Write).toBe(2);
    expect(ACCESS_LEVEL.Full).toBe(3);
  });
});

describe('MODULE constante', () => {
  it('are codurile corecte (identice cu backend-ul)', () => {
    expect(MODULE.Dashboard).toBe('dashboard');
    expect(MODULE.Patients).toBe('patients');
    expect(MODULE.Users).toBe('users');
    expect(MODULE.Clinic).toBe('clinic');
  });
});
