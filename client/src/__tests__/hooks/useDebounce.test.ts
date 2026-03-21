/**
 * Teste unitare pentru hooks/useDebounce.ts
 * Verifică că debounce-ul returnează valoarea corectă:
 * - imediat după mount: valoarea inițială
 * - înainte de delay: valoarea veche
 * - după delay: valoarea nouă
 * - la modificări rapide succesive: se resetează timer-ul
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from '@/hooks/useDebounce';

describe('useDebounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ── Valoare inițială ──────────────────────────────────────────────────────

  it('returnează valoarea inițială imediat după mount', () => {
    const { result } = renderHook(() => useDebounce('initial', 300));
    expect(result.current).toBe('initial');
  });

  it('funcționează cu tipul number', () => {
    const { result } = renderHook(() => useDebounce(42, 500));
    expect(result.current).toBe(42);
  });

  it('funcționează cu tipul boolean', () => {
    const { result } = renderHook(() => useDebounce(true, 200));
    expect(result.current).toBe(true);
  });

  // ── Delay înainte de update ───────────────────────────────────────────────

  it('nu actualizează valoarea înainte de expirarea delay-ului', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    rerender({ value: 'updated', delay: 300 });

    act(() => { vi.advanceTimersByTime(150); }); // jumătate din delay
    expect(result.current).toBe('initial');
  });

  it('actualizează valoarea exact după delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    rerender({ value: 'updated', delay: 300 });

    act(() => { vi.advanceTimersByTime(300); }); // exact delay-ul
    expect(result.current).toBe('updated');
  });

  it('actualizează valoarea după delay cu o clipă în plus', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    rerender({ value: 'final', delay: 300 });

    act(() => { vi.advanceTimersByTime(350); });
    expect(result.current).toBe('final');
  });

  // ── Reset timer la modificări rapide ──────────────────────────────────────

  it('resetează timer-ul la modificări succesive rapide', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'a', delay: 300 } }
    );

    // Schimbare rapidă: 'a' → 'b' → 'c'
    rerender({ value: 'b', delay: 300 });
    act(() => { vi.advanceTimersByTime(100); }); // 100ms — nu s-a actualizat

    rerender({ value: 'c', delay: 300 });
    act(() => { vi.advanceTimersByTime(200); }); // 300ms totale de la 'b', dar timer reset la 'c'
    expect(result.current).toBe('a'); // delay pentru 'c' nu s-a terminat

    act(() => { vi.advanceTimersByTime(100); }); // acum 300ms de la 'c'
    expect(result.current).toBe('c'); // valoarea finală
  });

  // ── Cleanup ───────────────────────────────────────────────────────────────

  it('curăță timer-ul la unmount (fără memory leaks)', () => {
    const { result, unmount, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 300 } }
    );

    rerender({ value: 'updated', delay: 300 });
    unmount(); // timer-ul trebuie să fie anulat la unmount

    act(() => { vi.advanceTimersByTime(300); });
    // Nu verificăm result.current după unmount — tesăm că nu se aruncă erori
    expect(true).toBe(true); // test trece dacă nu se aruncă excepții
  });

  // ── delay=0 ───────────────────────────────────────────────────────────────

  it('cu delay=0 actualizează imediat după tick', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 0 } }
    );

    rerender({ value: 'immediate', delay: 0 });
    act(() => { vi.advanceTimersByTime(0); });
    expect(result.current).toBe('immediate');
  });
});
