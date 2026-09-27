import { describe, expect, it } from 'vitest'
import {
  createPaymentSchema, invoiceCustomerSchema, reasonSchema, reconcileSchema,
} from '@/features/billing/schemas/billing.schema'

const CASH = 'cash'
const CARD = 'card'
const TRANSFER = 'transfer'

const schema = (balance: number, hasActivePayments = false) =>
  createPaymentSchema({ balance, fiscalMethodIds: [CASH, CARD], hasActivePayments })

const payment = (...tenders: [string, number][]) => ({
  tenders: tenders.map(([paymentMethodId, amount]) => ({ paymentMethodId, amount })),
  notes: '',
})

describe('createPaymentSchema', () => {
  it('should accept a full cash payment', () => {
    expect(schema(150).safeParse(payment([CASH, 150])).success).toBe(true)
  })

  it('should accept cash + card on the same receipt when the sum equals the balance (100 + 50 = 150)', () => {
    expect(schema(150).safeParse(payment([CASH, 100], [CARD, 50])).success).toBe(true)
  })

  it('should reject a partial cash payment — the receipt covers the whole amount', () => {
    expect(schema(150).safeParse(payment([CASH, 100])).success).toBe(false)
  })

  it('should accept a partial bank transfer', () => {
    expect(schema(150).safeParse(payment([TRANSFER, 40])).success).toBe(true)
  })

  it('should reject an amount above the balance', () => {
    expect(schema(150).safeParse(payment([TRANSFER, 150.01])).success).toBe(false)
  })

  it('should reject a fiscal payment after a previous payment', () => {
    expect(schema(110, true).safeParse(payment([CASH, 110])).success).toBe(false)
  })

  it('should reject mixing a bank transfer with cash', () => {
    expect(schema(150).safeParse(payment([CASH, 100], [TRANSFER, 50])).success).toBe(false)
  })

  it('should reject the same method twice', () => {
    expect(schema(150).safeParse(payment([TRANSFER, 50], [TRANSFER, 50])).success).toBe(false)
  })

  it('should reject amounts with more than 2 decimals', () => {
    expect(schema(150).safeParse(payment([TRANSFER, 10.005])).success).toBe(false)
  })

  it('should not be fooled by floating point sums (0.1 + 0.2 = 0.3)', () => {
    expect(schema(0.3).safeParse(payment([CASH, 0.1], [CARD, 0.2])).success).toBe(true)
  })
})

const customer = {
  seriesId: 's1',
  customerIsLegalEntity: false,
  customerName: 'Popescu Ion',
  includeCnp: false,
  customerFiscalCode: '',
  customerTradeRegisterNumber: '',
  customerAddress: '',
  customerCity: '',
  customerCounty: '',
  lines: [{ medicalServiceId: 'm1', code: 'CONS', name: 'Consultație', quantity: 1, unitPrice: 100, vatRateId: 'v1' }],
}

describe('invoiceCustomerSchema', () => {
  it('should accept a natural person without address', () => {
    expect(invoiceCustomerSchema.safeParse(customer).success).toBe(true)
  })

  it('should require CUI and address for a legal entity', () => {
    const result = invoiceCustomerSchema.safeParse({ ...customer, customerIsLegalEntity: true, customerName: 'Firma SRL' })
    expect(result.success).toBe(false)
    const paths = result.error?.issues.map((i) => i.path.join('.'))
    expect(paths).toEqual(expect.arrayContaining(['customerFiscalCode', 'customerAddress']))
  })

  it('should validate the CUI format', () => {
    const legal = { ...customer, customerIsLegalEntity: true, customerName: 'Firma SRL', customerAddress: 'Str. 1' }
    expect(invoiceCustomerSchema.safeParse({ ...legal, customerFiscalCode: 'RO12345678' }).success).toBe(true)
    expect(invoiceCustomerSchema.safeParse({ ...legal, customerFiscalCode: '12AB' }).success).toBe(false)
  })

  it('should reject an invoice without lines', () => {
    expect(invoiceCustomerSchema.safeParse({ ...customer, lines: [] }).success).toBe(false)
  })
})

describe('reconcileSchema', () => {
  it('should require the receipt number when the receipt was printed', () => {
    expect(reconcileSchema.safeParse({ wasPrinted: 'yes', receiptNumber: '', note: '' }).success).toBe(false)
    expect(reconcileSchema.safeParse({ wasPrinted: 'yes', receiptNumber: '0042', note: '' }).success).toBe(true)
  })

  it('should not require a number when the receipt was not printed', () => {
    expect(reconcileSchema.safeParse({ wasPrinted: 'no', receiptNumber: '', note: '' }).success).toBe(true)
  })

  it('should require an explicit choice', () => {
    expect(reconcileSchema.safeParse({ wasPrinted: undefined, receiptNumber: '', note: '' }).success).toBe(false)
  })
})

describe('reasonSchema', () => {
  it('should reject a blank reason', () => {
    expect(reasonSchema.safeParse({ reason: '   ' }).success).toBe(false)
  })
})
