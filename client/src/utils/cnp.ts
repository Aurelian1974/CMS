/// Utilitare CNP (Cod Numeric Personal românesc) — 13 cifre.
/// Logica de validare este identică cu cea din backend
/// (`ValyanClinic.Domain.ValueObjects.Cnp`), ca să nu ajungă la server
/// CNP-uri pe care validatorul FluentValidation le respinge oricum.

/// Vectorul de ponderi pentru cifra de control (poziția 13).
const CONTROL_WEIGHTS = [2, 7, 9, 1, 4, 6, 3, 5, 8, 2, 7, 9] as const

/// 13 cifre, prima diferită de 0.
const CNP_FORMAT = /^[1-9]\d{12}$/

/**
 * Validare completă CNP: format (13 cifre, prima 1-9) + cifră de control.
 * Suma ponderată a primelor 12 cifre modulo 11; restul 10 → cifra de control 1.
 */
export const isValidCnp = (cnp?: string | null): boolean => {
  if (!cnp || !CNP_FORMAT.test(cnp)) return false

  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(cnp[i]) * CONTROL_WEIGHTS[i]

  const remainder = sum % 11
  const expected = remainder === 10 ? 1 : remainder

  return Number(cnp[12]) === expected
}

/// Secolul nașterii după prima cifră (S): 1/2 → 1900, 3/4 → 1800, 5/6 → 2000.
/// 7/8 (rezident străin) și 9 (străin) nu codifică secolul → nedeterminabil.
const CENTURY_BY_FIRST_DIGIT: Record<string, number> = {
  '1': 1900, '2': 1900,
  '3': 1800, '4': 1800,
  '5': 2000, '6': 2000,
}

/// Codul de gen din nomenclator (Genders.Code): 'M' / 'F'.
export type CnpGenderCode = 'M' | 'F'

export interface CnpInfo {
  /** Data nașterii ca `YYYY-MM-DD`, sau `null` dacă nu e codificată/validă. */
  birthDate: string | null
  /** Codul de gen ('M' pentru cifre impare, 'F' pentru pare), sau `null` pentru CNP-uri 9x. */
  genderCode: CnpGenderCode | null
}

/**
 * Extrage data nașterii și genul dintr-un CNP valid.
 * Returnează `null` pe ambele câmpuri dacă CNP-ul nu e valid.
 */
export const parseCnp = (cnp?: string | null): CnpInfo => {
  if (!isValidCnp(cnp)) return { birthDate: null, genderCode: null }

  const value = cnp as string
  const first = value[0]

  // Gen: cifrele impare = masculin, pare = feminin. Prima cifră 9 (străin) nu îl codifică.
  const genderCode: CnpGenderCode | null =
    first === '9' ? null : Number(first) % 2 === 1 ? 'M' : 'F'

  const century = CENTURY_BY_FIRST_DIGIT[first]
  if (!century) return { birthDate: null, genderCode }

  const year  = century + Number(value.slice(1, 3))
  const month = Number(value.slice(3, 5))
  const day   = Number(value.slice(5, 7))

  // Verificăm că data chiar există (ex. 30 februarie e respins).
  const date = new Date(year, month - 1, day)
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return { birthDate: null, genderCode }
  }

  const mm = String(month).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return { birthDate: `${year}-${mm}-${dd}`, genderCode }
}
