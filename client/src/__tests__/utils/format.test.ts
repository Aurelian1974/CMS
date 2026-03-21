/**
 * Teste unitare pentru utils/format.ts
 * Verifică toate funcțiile de formatare cu locale ro-RO:
 * formatDate, formatDateTime, formatCurrency, formatNumber, formatMonthYear
 */
import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  formatMonthYear,
} from '@/utils/format';

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formatează un obiect Date la dd.MM.yyyy', () => {
    const date = new Date(2025, 0, 15); // 15 ianuarie 2025 în time local
    expect(formatDate(date)).toBe('15.01.2025');
  });

  it('formatează 31 decembrie corect', () => {
    const date = new Date(2025, 11, 31);
    expect(formatDate(date)).toBe('31.12.2025');
  });

  it('formatează luna cu zero-padding', () => {
    const date = new Date(2025, 5, 7); // 7 iunie 2025
    expect(formatDate(date)).toBe('07.06.2025');
  });

  it('formatează ziua cu zero-padding', () => {
    const date = new Date(2025, 0, 1); // 1 ianuarie 2025
    expect(formatDate(date)).toBe('01.01.2025');
  });
});

// ── formatDateTime ────────────────────────────────────────────────────────────

describe('formatDateTime', () => {
  it('conține data formatată în ro-RO', () => {
    const date = new Date(2025, 2, 20, 14, 30); // 20 martie 2025 14:30
    const result = formatDateTime(date);
    expect(result).toContain('20.03.2025');
  });

  it('conține ora și minuții', () => {
    const date = new Date(2025, 2, 20, 9, 5); // 09:05
    const result = formatDateTime(date);
    expect(result).toMatch(/\d{2}:\d{2}/);
  });

  it('returnează string non-gol pentru orice dată validă', () => {
    const result = formatDateTime(new Date(2025, 6, 4, 12, 0));
    expect(result.length).toBeGreaterThan(0);
  });
});

// ── formatCurrency ────────────────────────────────────────────────────────────

describe('formatCurrency', () => {
  it('include simbolul RON', () => {
    const result = formatCurrency(100);
    expect(result).toContain('RON');
  });

  it('formatează zero corect', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0');
    expect(result).toContain('RON');
  });

  it('formatează număr mare cu separator de mii', () => {
    const result = formatCurrency(1234.56);
    // ro-RO: punct ca separator de mii, virgulă ca separator zecimal
    expect(result).toContain('1.234');
  });

  it('formatează sumă negativă', () => {
    const result = formatCurrency(-500);
    expect(result).toContain('500');
    expect(result).toContain('RON');
  });
});

// ── formatNumber ──────────────────────────────────────────────────────────────

describe('formatNumber', () => {
  it('formatează cu 2 zecimale implicit', () => {
    expect(formatNumber(1234.567)).toBe('1.234,57');
  });

  it('formatează cu 0 zecimale (rotunjire)', () => {
    expect(formatNumber(1234.5, 0)).toBe('1.235');
  });

  it('formatează cu 4 zecimale', () => {
    const result = formatNumber(3.14159, 4);
    expect(result).toBe('3,1416');
  });

  it('formatează zero cu 2 zecimale', () => {
    expect(formatNumber(0)).toBe('0,00');
  });

  it('formatează număr negativ', () => {
    const result = formatNumber(-1234.56);
    expect(result).toContain('-1.234,56');
  });

  it('formatează număr mic (sub 1000) fără separator de mii', () => {
    expect(formatNumber(999.99)).toBe('999,99');
  });
});

// ── formatMonthYear ───────────────────────────────────────────────────────────

describe('formatMonthYear', () => {
  it('conține anul corect', () => {
    const date = new Date(2025, 0, 15);
    const result = formatMonthYear(date);
    expect(result).toContain('2025');
  });

  it('conține luna în română (Ianuarie)', () => {
    const date = new Date(2025, 0, 15); // ianuarie
    const result = formatMonthYear(date).toLowerCase();
    expect(result).toContain('ianuarie');
  });

  it('conține luna decembrie', () => {
    const date = new Date(2025, 11, 1);
    const result = formatMonthYear(date).toLowerCase();
    expect(result).toContain('decembrie');
  });

  it('returnează un string non-gol', () => {
    const result = formatMonthYear(new Date(2025, 5, 1));
    expect(result.length).toBeGreaterThan(0);
  });
});
