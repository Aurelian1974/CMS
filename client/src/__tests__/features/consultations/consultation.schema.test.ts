/**
 * Teste unitare pentru features/consultations/schemas/consultation.schema.ts
 * Verifică validarea Zod pentru:
 * - patientId: obligatoriu
 * - doctorId: obligatoriu
 * - date: obligatoriu
 * - motiv, examenClinic, recomandari, observatii: opționale, max 4000
 * - diagnostic: opțional, max 100000 (JSON ICD-10 cu rich-text)
 * - diagnosticCodes: opțional, max 2000
 * - semne vitale: limite de plauzibilitate + sistolică > diastolică
 * - appointmentId: opțional
 */
import { describe, it, expect } from 'vitest'
import { consultationSchema } from '@/features/consultations/schemas/consultation.schema'

// ── Date valide de bază ───────────────────────────────────────────────────────

const validConsultation = {
  patientId: 'patient-uuid-1',
  doctorId: 'doctor-uuid-1',
  date: '2025-06-15',
}

// ── consultationSchema ────────────────────────────────────────────────────────

describe('consultationSchema', () => {
  describe('consultație validă minimală', () => {
    it('acceptă câmpurile obligatorii fără cele opționale', () => {
      const result = consultationSchema.safeParse(validConsultation)
      expect(result.success).toBe(true)
    })

    it('acceptă consultație completă cu toate câmpurile', () => {
      const full = {
        ...validConsultation,
        appointmentId: 'appt-uuid-1',
        motiv: 'Durere de cap',
        examenClinic: 'Normal',
        diagnostic: 'Migrenă',
        diagnosticCodes: 'G43.9',
        recomandari: 'Repaus',
        observatii: 'Pacient stabil',
      }
      expect(consultationSchema.safeParse(full).success).toBe(true)
    })

    it('acceptă câmpuri opționale goale (string vid)', () => {
      const result = consultationSchema.safeParse({
        ...validConsultation,
        motiv: '',
        examenClinic: '',
        diagnostic: '',
        diagnosticCodes: '',
        recomandari: '',
        observatii: '',
        appointmentId: '',
      })
      expect(result.success).toBe(true)
    })
  })

  // ── patientId ──────────────────────────────────────────────────────────────

  describe('patientId', () => {
    it('eșuează când este gol', () => {
      const result = consultationSchema.safeParse({ ...validConsultation, patientId: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('obligatoriu')
      }
    })

    it('eșuează când lipsește', () => {
      const { patientId: _, ...withoutPatient } = validConsultation
      const result = consultationSchema.safeParse(withoutPatient)
      expect(result.success).toBe(false)
    })
  })

  // ── doctorId ───────────────────────────────────────────────────────────────

  describe('doctorId', () => {
    it('eșuează când este gol', () => {
      const result = consultationSchema.safeParse({ ...validConsultation, doctorId: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('obligatoriu')
      }
    })

    it('eșuează când lipsește', () => {
      const { doctorId: _, ...withoutDoctor } = validConsultation
      const result = consultationSchema.safeParse(withoutDoctor)
      expect(result.success).toBe(false)
    })
  })

  // ── date ───────────────────────────────────────────────────────────────────

  describe('date', () => {
    it('eșuează când este gol', () => {
      const result = consultationSchema.safeParse({ ...validConsultation, date: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('obligatorie')
      }
    })

    it('eșuează când lipsește', () => {
      const { date: _, ...withoutDate } = validConsultation
      const result = consultationSchema.safeParse(withoutDate)
      expect(result.success).toBe(false)
    })
  })

  // ── motiv ──────────────────────────────────────────────────────────────────

  describe('motiv', () => {
    it('acceptă text sub limita de 4000', () => {
      const result = consultationSchema.safeParse({
        ...validConsultation,
        motiv: 'Test motiv',
      })
      expect(result.success).toBe(true)
    })

    it('eșuează când depășește 4000 caractere', () => {
      const result = consultationSchema.safeParse({
        ...validConsultation,
        motiv: 'a'.repeat(4001),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('4000')
      }
    })
  })

  // ── diagnosticCodes ────────────────────────────────────────────────────────

  describe('diagnosticCodes', () => {
    it('acceptă text sub limita de 2000', () => {
      const result = consultationSchema.safeParse({
        ...validConsultation,
        diagnosticCodes: 'G43.9, R51',
      })
      expect(result.success).toBe(true)
    })

    it('eșuează când depășește 2000 caractere', () => {
      const result = consultationSchema.safeParse({
        ...validConsultation,
        diagnosticCodes: 'a'.repeat(2001),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2000')
      }
    })
  })

  // ── Alte câmpuri text opționale (examen, diagnostic, recomandari, observatii)

  describe('câmpuri text opționale max 4000', () => {
    const fields = ['examenClinic', 'recomandari', 'observatii'] as const

    fields.forEach(field => {
      it(`${field} eșuează când depășește 4000 caractere`, () => {
        const result = consultationSchema.safeParse({
          ...validConsultation,
          [field]: 'a'.repeat(4001),
        })
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('4000')
        }
      })
    })
  })

  // ── diagnostic (JSON ICD-10) ─────────────────────────────────────────────────

  describe('diagnostic', () => {
    it('acceptă peste 4000 caractere', () => {
      expect(consultationSchema.safeParse({ ...validConsultation, diagnostic: 'a'.repeat(20_000) }).success).toBe(true)
    })

    it('eșuează peste 100000 caractere', () => {
      expect(consultationSchema.safeParse({ ...validConsultation, diagnostic: 'a'.repeat(100_001) }).success).toBe(false)
    })
  })

  // ── Semne vitale ─────────────────────────────────────────────────────────────

  describe('semne vitale', () => {
    it('acceptă valori uzuale', () => {
      const result = consultationSchema.safeParse({
        ...validConsultation,
        greutate: 72.5, inaltime: 175, tensiuneSistolica: 120, tensiuneDiastolica: 80,
        puls: 72, frecventaRespiratorie: 16, temperatura: 36.6, spO2: 98, glicemie: 95,
      })
      expect(result.success).toBe(true)
    })

    it('respinge pulsul 0', () => {
      expect(consultationSchema.safeParse({ ...validConsultation, puls: 0 }).success).toBe(false)
    })

    it('respinge sistolica ≤ diastolica, pe câmpul tensiuneSistolica', () => {
      const result = consultationSchema.safeParse({ ...validConsultation, tensiuneSistolica: 80, tensiuneDiastolica: 90 })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['tensiuneSistolica'])
      }
    })
  })
})
