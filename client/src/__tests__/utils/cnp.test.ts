/**
 * Teste unitare pentru utils/cnp.ts
 * Verifică paritatea cu validarea din backend (Domain/ValueObjects/Cnp.cs):
 * format, cifră de control, extragere dată naștere + gen.
 */
import { describe, it, expect } from 'vitest';
import { isValidCnp, parseCnp } from '@/utils/cnp';

// ── isValidCnp ────────────────────────────────────────────────────────────────

describe('isValidCnp', () => {
  it('acceptă CNP valid masculin (secolul XX)', () => {
    expect(isValidCnp('1900101123457')).toBe(true);
  });

  it('acceptă CNP valid feminin', () => {
    expect(isValidCnp('2850202234568')).toBe(true);
  });

  it('acceptă CNP valid cu prima cifră 9 (străin)', () => {
    expect(isValidCnp('9010101999995')).toBe(true);
  });

  it('respinge cifră de control greșită', () => {
    expect(isValidCnp('1900101123456')).toBe(false);
  });

  it('respinge prima cifră 0', () => {
    expect(isValidCnp('0900101123456')).toBe(false);
  });

  it('respinge lungime diferită de 13', () => {
    expect(isValidCnp('190010112345')).toBe(false);
    expect(isValidCnp('19001011234567')).toBe(false);
  });

  it('respinge caractere non-numerice', () => {
    expect(isValidCnp('1900101A23456')).toBe(false);
  });

  it('respinge null / undefined / gol', () => {
    expect(isValidCnp(null)).toBe(false);
    expect(isValidCnp(undefined)).toBe(false);
    expect(isValidCnp('')).toBe(false);
  });
});

// ── parseCnp ──────────────────────────────────────────────────────────────────

describe('parseCnp', () => {
  it('extrage data nașterii și genul masculin (prima cifră 1 → 1900)', () => {
    expect(parseCnp('1900101123457')).toEqual({ birthDate: '1990-01-01', genderCode: 'M' });
  });

  it('extrage data nașterii și genul feminin (prima cifră 2 → 1900)', () => {
    expect(parseCnp('2850202234568')).toEqual({ birthDate: '1985-02-02', genderCode: 'F' });
  });

  it('interpretează prima cifră 5/6 ca secolul XXI', () => {
    // 5 = masculin născut după 2000
    const cnp = '5050315123451';
    expect(isValidCnp(cnp)).toBe(true);
    expect(parseCnp(cnp)).toEqual({ birthDate: '2005-03-15', genderCode: 'M' });
  });

  it('nu determină data nașterii pentru CNP-uri 9x (străini), dar nici genul', () => {
    expect(parseCnp('9010101999995')).toEqual({ birthDate: null, genderCode: null });
  });

  it('returnează null pentru CNP invalid', () => {
    expect(parseCnp('1900101123456')).toEqual({ birthDate: null, genderCode: null });
  });

  it('returnează null pe dată inexistentă (ex. 31 februarie)', () => {
    const cnp = '1900231123457';
    // cifra de control poate fi validă, dar data nu există
    expect(parseCnp(cnp).birthDate).toBeNull();
  });
});
