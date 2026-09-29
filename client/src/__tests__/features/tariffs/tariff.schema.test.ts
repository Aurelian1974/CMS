import { describe, expect, it } from 'vitest'
import {
  importInvestigationsSchema,
  medicalServicePriceSchema,
  medicalServiceSchema,
  vatRateSchema,
} from '@/features/tariffs/schemas/tariff.schema'

const validService = {
  code: 'CONS',
  name: 'Consultație pneumologie',
  categoryId: 'F2000000-0000-0000-0000-000000000001',
  durationMinutes: '',
  investigationTypeCode: '',
  price: '100',
  vatRateId: 'F1000000-0000-0000-0000-000000000001',
  validFrom: '2026-09-27',
}

describe('medicalServiceSchema', () => {
  it('should accept a valid service and coerce the price to a number', () => {
    const result = medicalServiceSchema.safeParse(validService)
    expect(result.success).toBe(true)
    expect(result.data?.price).toBe(100)
  })

  it('should reject a negative price', () => {
    expect(medicalServiceSchema.safeParse({ ...validService, price: '-1' }).success).toBe(false)
  })

  it('should reject a price with more than 2 decimals', () => {
    expect(medicalServiceSchema.safeParse({ ...validService, price: '10.005' }).success).toBe(false)
  })

  it('should accept a price with exactly 2 decimals', () => {
    expect(medicalServiceSchema.safeParse({ ...validService, price: '49.99' }).success).toBe(true)
  })

  it('should require the category', () => {
    expect(medicalServiceSchema.safeParse({ ...validService, categoryId: '' }).success).toBe(false)
  })
})

describe('medicalServicePriceSchema', () => {
  it('should require the date from which the price applies', () => {
    expect(medicalServicePriceSchema.safeParse({ price: 120, vatRateId: 'x', validFrom: '' }).success).toBe(false)
  })
})

describe('vatRateSchema', () => {
  const base = {
    code: 'SCUTIT', name: 'Scutit', percent: 0, ublCategoryCode: 'E',
    exemptionReasonCode: '', exemptionReasonText: '', isActive: true,
  }

  it('should reject an exempt regime with a positive percent', () => {
    expect(vatRateSchema.safeParse({ ...base, percent: 21 }).success).toBe(false)
  })

  it('should accept a standard 21% rate', () => {
    expect(vatRateSchema.safeParse({ ...base, code: 'S21', ublCategoryCode: 'S', percent: 21 }).success).toBe(true)
  })
})

describe('importInvestigationsSchema', () => {
  const row = (overrides: Partial<{ typeCode: string; selected: boolean; name: string; price: string }> = {}) => ({
    typeCode: 'ECG', selected: true, name: 'Electrocardiogramă', price: '', ...overrides,
  })
  const form = (rows: ReturnType<typeof row>[], vatRateId = 'F1000000-0000-0000-0000-000000000001') => ({
    vatRateId, validFrom: '2026-09-29', rows,
  })

  it('should accept selected rows without price and without VAT regime', () => {
    expect(importInvestigationsSchema.safeParse(form([row()], '')).success).toBe(true)
  })

  it('should reject when nothing is selected', () => {
    expect(importInvestigationsSchema.safeParse(form([row({ selected: false })])).success).toBe(false)
  })

  it('should ignore invalid values on rows that are not selected', () => {
    const result = importInvestigationsSchema.safeParse(
      form([row(), row({ typeCode: 'MRI', selected: false, name: '', price: '-3' })]))
    expect(result.success).toBe(true)
  })

  it('should reject a negative price on a selected row', () => {
    expect(importInvestigationsSchema.safeParse(form([row({ price: '-1' })])).success).toBe(false)
  })

  it('should require the VAT regime when a price is filled', () => {
    const result = importInvestigationsSchema.safeParse(form([row({ price: '80' })], ''))
    expect(result.success).toBe(false)
    expect(result.error?.issues[0]?.path).toEqual(['vatRateId'])
  })

  it('should require the service name on a selected row', () => {
    expect(importInvestigationsSchema.safeParse(form([row({ name: '  ' })])).success).toBe(false)
  })
})
