import { describe, expect, it } from 'vitest'
import {
  computeQuantity,
  formatPosology,
  formatSeriesNumber,
  statusBadgeVariant,
} from '@/features/prescriptions/utils/prescriptionFormat'
import { prescriptionFormSchema, prescriptionItemSchema, cancelPrescriptionSchema } from '@/features/prescriptions/schemas/prescription.schema'
import { PRESCRIPTION_STATUS } from '@/features/prescriptions/types/prescription.types'

const item = (overrides: Partial<Parameters<typeof prescriptionItemSchema.parse>[0]> = {}) => ({
  key: 'k1',
  consultationMedicationId: null,
  drugCode: 'W66595005',
  drugName: 'SERETIDE',
  details: null,
  availableLists: ['B'],
  copaymentListType: 'B',
  diagnosisCode: null,
  doseMorning: 1,
  doseAfternoon: null,
  doseEvening: 1,
  durationDays: 10,
  quantity: null,
  instructions: null,
  ...overrides,
})

const form = (items = [item()]) => ({
  patientId: 'p1', doctorId: 'd1', careTypeId: '', insuredCategoryId: '', treatmentDays: null,
  diagnostic: '', diagnosticCodes: '', registryNumber: '', isContinuation: false,
  referralLetterNumber: '', notes: '', items,
})

describe('prescriptionFormat', () => {
  it('should show "Ciornă" when the prescription has no number yet', () => {
    expect(formatSeriesNumber(null, null)).toBe('Ciornă')
    expect(formatSeriesNumber('RC', 12)).toBe('RC 12')
  })

  it('should build the D.S. text from doses, duration and instructions', () => {
    expect(formatPosology({ doseMorning: 1, doseAfternoon: null, doseEvening: 0.5, durationDays: 7, instructions: 'după masă' }))
      .toBe('dimineața 1, seara 0,5 — 7 zile — după masă')
    expect(formatPosology({ doseMorning: null, doseAfternoon: null, doseEvening: null, durationDays: null })).toBe('—')
  })

  it('should compute quantity as daily doses × days', () => {
    expect(computeQuantity({ doseMorning: 1, doseAfternoon: 1, doseEvening: 0.5, durationDays: 10 })).toBe(25)
    expect(computeQuantity({ doseMorning: 1, doseAfternoon: null, doseEvening: null, durationDays: null })).toBeNull()
  })

  it('should map cancelled status to the danger badge', () => {
    expect(statusBadgeVariant(PRESCRIPTION_STATUS.Cancelled)).toBe('danger')
    expect(statusBadgeVariant(PRESCRIPTION_STATUS.Draft)).toBe('neutral')
  })
})

describe('prescription.schema', () => {
  it('should accept a mixed list of compensated and non-compensated drugs', () => {
    const result = prescriptionFormSchema.safeParse(form([item(), item({ key: 'k2', copaymentListType: null })]))
    expect(result.success).toBe(true)
  })

  it('should reject a form without drugs', () => {
    const result = prescriptionFormSchema.safeParse(form([]))
    expect(result.success).toBe(false)
  })

  it('should reject a compensated free-text drug', () => {
    const result = prescriptionItemSchema.safeParse(item({ drugCode: null, drugName: 'Magistral' }))
    expect(result.success).toBe(false)
  })

  it('should reject doses that are not multiples of 0.25', () => {
    const result = prescriptionItemSchema.safeParse(item({ doseMorning: 0.3 }))
    expect(result.success).toBe(false)
  })

  it('should require a cancel reason', () => {
    expect(cancelPrescriptionSchema.safeParse({ reason: '   ' }).success).toBe(false)
    expect(cancelPrescriptionSchema.safeParse({ reason: 'Doză greșită' }).success).toBe(true)
  })
})
