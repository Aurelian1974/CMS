/**
 * Teste unitare pentru features/consultations/schemas/consultation.schema.ts
 * Verifică validarea Zod pentru:
 * - patientId: obligatoriu
 * - doctorId: obligatoriu
 * - date: obligatoriu
 * - motiv, examenClinic, diagnostic, recomandari, observatii: opționale, max 4000
 * - diagnosticCodes: opțional, max 2000
 * - statusId, appointmentId: opționale
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
        statusId: 'status-uuid-1',
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
        statusId: '',
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
    const fields = ['examenClinic', 'diagnostic', 'recomandari', 'observatii'] as const

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
})
