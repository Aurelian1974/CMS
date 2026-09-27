import { describe, expect, it } from 'vitest'
import { medicalServicePriceSchema, medicalServiceSchema, vatRateSchema } from '@/features/tariffs/schemas/tariff.schema'

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
