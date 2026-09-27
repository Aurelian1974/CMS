/**
 * Teste unitare pentru features/appointments/schemas/appointment.schema.ts
 * Verifică validarea Zod pentru:
 * - patientId: obligatoriu
 * - doctorId: obligatoriu
 * - date: obligatoriu
 * - startTime: obligatoriu (format HH:mm)
 * - endTime: obligatoriu (format HH:mm, după startTime)
 * - statusId: opțional
 * - notes: opțional, max 2000 caractere
 */
import { describe, it, expect } from 'vitest'
import { appointmentSchema } from '@/features/appointments/schemas/appointment.schema'

// ── Date valide de bază ───────────────────────────────────────────────────────

const validAppointment = {
  patientId: 'patient-uuid-1',
  doctorId: 'doctor-uuid-1',
  date: '2025-03-15',
  startTime: '09:00',
  endTime: '09:30',
}

// ── appointmentSchema ─────────────────────────────────────────────────────────

describe('appointmentSchema', () => {
  describe('programare validă minimală', () => {
    it('acceptă câmpurile obligatorii fără cele opționale', () => {
      const result = appointmentSchema.safeParse(validAppointment)
      expect(result.success).toBe(true)
    })

    it('acceptă programare completă cu toate câmpurile opționale', () => {
      const full = {
        ...validAppointment,
        statusId: 'status-uuid-1',
        notes: 'Observații test',
      }
      expect(appointmentSchema.safeParse(full).success).toBe(true)
    })

    it('acceptă statusId gol (string vid)', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, statusId: '' })
      expect(result.success).toBe(true)
    })

    it('acceptă notes gol (string vid)', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, notes: '' })
      expect(result.success).toBe(true)
    })
  })

  // ── patientId ──────────────────────────────────────────────────────────────

  describe('patientId', () => {
    it('eșuează când este gol', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, patientId: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('obligatoriu')
      }
    })

    it('eșuează când lipsește', () => {
      const { patientId: _, ...withoutPatient } = validAppointment
      const result = appointmentSchema.safeParse(withoutPatient)
      expect(result.success).toBe(false)
    })
  })

  // ── doctorId ───────────────────────────────────────────────────────────────

  describe('doctorId', () => {
    it('eșuează când este gol', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, doctorId: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('obligatoriu')
      }
    })

    it('eșuează când lipsește', () => {
      const { doctorId: _, ...withoutDoctor } = validAppointment
      const result = appointmentSchema.safeParse(withoutDoctor)
      expect(result.success).toBe(false)
    })
  })

  // ── startTime ──────────────────────────────────────────────────────────────

  describe('startTime', () => {
    it('eșuează când este gol', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, startTime: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('obligatori')
      }
    })

    it('eșuează când lipsește', () => {
      const { startTime: _, ...withoutStart } = validAppointment
      const result = appointmentSchema.safeParse(withoutStart)
      expect(result.success).toBe(false)
    })

    it('acceptă format HH:mm', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, startTime: '08:00' })
      expect(result.success).toBe(true)
    })
  })

  // ── endTime ────────────────────────────────────────────────────────────────

  describe('endTime', () => {
    it('should fail when end time is before start time', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, startTime: '10:00', endTime: '09:30' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(['endTime'])
      }
    })

    it('should fail when duration is under 5 minutes', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, startTime: '09:00', endTime: '09:03' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('5 minute')
      }
    })

    it('should compare times numerically, not lexicographically', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, startTime: '09:55', endTime: '10:05' })
      expect(result.success).toBe(true)
    })

    it('should fail when time format is invalid', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, endTime: '9:30' })
      expect(result.success).toBe(false)
    })
    it('eșuează când este gol', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, endTime: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('obligatori')
      }
    })

    it('eșuează când lipsește', () => {
      const { endTime: _, ...withoutEnd } = validAppointment
      const result = appointmentSchema.safeParse(withoutEnd)
      expect(result.success).toBe(false)
    })
  })

  // ── notes ──────────────────────────────────────────────────────────────────

  describe('notes', () => {
    it('acceptă notes undefined', () => {
      const result = appointmentSchema.safeParse(validAppointment)
      expect(result.success).toBe(true)
    })

    it('acceptă notes cu exact 2000 caractere', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, notes: 'n'.repeat(2000) })
      expect(result.success).toBe(true)
    })

    it('eșuează când notes depășește 2000 caractere', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, notes: 'n'.repeat(2001) })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('2000')
      }
    })
  })

  // ── statusId ───────────────────────────────────────────────────────────────

  describe('statusId', () => {
    it('acceptă statusId undefined', () => {
      const result = appointmentSchema.safeParse(validAppointment)
      expect(result.success).toBe(true)
    })

    it('acceptă statusId cu valoare', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, statusId: 'status-123' })
      expect(result.success).toBe(true)
    })

    it('acceptă statusId gol', () => {
      const result = appointmentSchema.safeParse({ ...validAppointment, statusId: '' })
      expect(result.success).toBe(true)
    })
  })
})
