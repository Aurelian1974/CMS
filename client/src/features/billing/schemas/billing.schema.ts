import { z } from 'zod'

// Aceleași limite ca FluentValidation (CreatePayment / CancelPayment / CreateInvoice / ReconcileFiscalReceipt)
const hasAtMostDecimals = (v: number, decimals: number) => {
  const scaled = v * 10 ** decimals
  return Math.abs(scaled - Math.round(scaled)) < 1e-6
}

const round2 = (v: number) => Math.round(v * 100) / 100

const amount = z.coerce
  .number({ error: 'Suma trebuie să fie un număr' })
  .gt(0, 'Suma trebuie să fie mai mare decât zero')
  .refine((v) => hasAtMostDecimals(v, 2), 'Suma poate avea cel mult 2 zecimale')

export interface PaymentSchemaContext {
  /** Rest de plată al consultației. */
  balance: number
  /** Metodele care emit bon fiscal (NUMERAR, CARD). */
  fiscalMethodIds: string[]
  /** Există deja plăți neanulate pe consultație. */
  hasActivePayments: boolean
}

/**
 * Regulile de business sunt verificate și în Payment_Create (50631 / 50633); aici doar
 * le semnalăm înainte de trimitere. Bonul fiscal se emite o singură dată, pe tot restul de plată.
 */
export const createPaymentSchema = ({ balance, fiscalMethodIds, hasActivePayments }: PaymentSchemaContext) =>
  z.object({
    tenders: z.array(z.object({
      paymentMethodId: z.string().min(1, 'Metoda de plată este obligatorie'),
      amount,
    })).min(1, 'Adăugați cel puțin o metodă de plată'),
    notes: z.string().max(500, 'Observațiile nu pot depăși 500 de caractere'),
  }).superRefine((v, ctx) => {
    const ids = v.tenders.map((t) => t.paymentMethodId)
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: 'custom', path: ['tenders'], message: 'O metodă de plată apare de mai multe ori' })
    }

    const sum = round2(v.tenders.reduce((s, t) => s + (Number.isFinite(t.amount) ? t.amount : 0), 0))
    if (sum > balance) {
      ctx.addIssue({ code: 'custom', path: ['tenders'], message: 'Suma încasată depășește restul de plată' })
      return
    }

    const isFiscal = v.tenders.some((t) => fiscalMethodIds.includes(t.paymentMethodId))
    const hasNonFiscal = v.tenders.some((t) => t.paymentMethodId && !fiscalMethodIds.includes(t.paymentMethodId))
    if (isFiscal && hasNonFiscal) {
      ctx.addIssue({ code: 'custom', path: ['tenders'],
        message: 'Transferul bancar nu se combină cu numerar / card pe aceeași încasare' })
    } else if (isFiscal && hasActivePayments) {
      ctx.addIssue({ code: 'custom', path: ['tenders'],
        message: 'Există deja o plată pe această consultație — bonul fiscal se emite o singură dată, pe întreaga sumă' })
    } else if (isFiscal && sum !== round2(balance)) {
      ctx.addIssue({ code: 'custom', path: ['tenders'],
        message: 'Plata în numerar / card se încasează integral (bonul fiscal acoperă toată suma)' })
    }
  })

export type PaymentFormData = z.infer<ReturnType<typeof createPaymentSchema>>

export const reasonSchema = z.object({
  reason: z.string().trim().min(1, 'Motivul este obligatoriu').max(500, 'Motivul nu poate depăși 500 de caractere'),
})

export type ReasonFormData = z.infer<typeof reasonSchema>

export const reconcileSchema = z.object({
  wasPrinted: z.enum(['yes', 'no'], { error: 'Alegeți rezultatul verificării' }),
  receiptNumber: z.string().trim().max(30, 'Maxim 30 de caractere'),
  note: z.string().max(500, 'Maxim 500 de caractere'),
}).refine((v) => v.wasPrinted === 'no' || v.receiptNumber.length > 0, {
  path: ['receiptNumber'], message: 'Introduceți numărul bonului tipărit',
})

export type ReconcileFormData = z.infer<typeof reconcileSchema>

export const invoiceLineSchema = z.object({
  medicalServiceId: z.string().nullable(),
  code: z.string().nullable(),
  name: z.string().trim().min(1, 'Denumirea este obligatorie').max(200, 'Maxim 200 de caractere'),
  quantity: z.coerce.number({ error: 'Cantitate invalidă' })
    .gt(0, 'Cantitatea trebuie să fie pozitivă')
    .refine((v) => hasAtMostDecimals(v, 3), 'Maxim 3 zecimale'),
  unitPrice: z.coerce.number({ error: 'Preț invalid' })
    .min(0, 'Prețul nu poate fi negativ')
    .refine((v) => hasAtMostDecimals(v, 2), 'Maxim 2 zecimale'),
  vatRateId: z.string().min(1, 'Regimul TVA este obligatoriu'),
})

export const invoiceCustomerSchema = z.object({
  seriesId: z.string(),
  customerIsLegalEntity: z.boolean(),
  customerName: z.string().trim().min(1, 'Numele clientului este obligatoriu').max(200, 'Maxim 200 de caractere'),
  includeCnp: z.boolean(),
  customerFiscalCode: z.string().trim().max(20, 'Maxim 20 de caractere'),
  customerTradeRegisterNumber: z.string().trim().max(30, 'Maxim 30 de caractere'),
  customerAddress: z.string().trim().max(500, 'Maxim 500 de caractere'),
  customerCity: z.string().trim().max(100, 'Maxim 100 de caractere'),
  customerCounty: z.string().trim().max(100, 'Maxim 100 de caractere'),
  /** Editabile doar la factura de corecție (după storno); altfel serverul folosește liniile consultației. */
  lines: z.array(invoiceLineSchema).min(1, 'Factura trebuie să aibă cel puțin o linie'),
}).superRefine((v, ctx) => {
  if (v.customerIsLegalEntity && !v.customerFiscalCode) {
    ctx.addIssue({ code: 'custom', path: ['customerFiscalCode'], message: 'CUI-ul este obligatoriu pentru persoane juridice' })
  }
  if (v.customerFiscalCode && !/^(RO)?\d{2,10}$/i.test(v.customerFiscalCode)) {
    ctx.addIssue({ code: 'custom', path: ['customerFiscalCode'], message: 'Format CUI invalid (ex: RO12345678 sau 12345678)' })
  }
  if (v.customerIsLegalEntity && !v.customerAddress) {
    ctx.addIssue({ code: 'custom', path: ['customerAddress'], message: 'Adresa este obligatorie pentru persoane juridice' })
  }
})

export type InvoiceCustomerFormData = z.infer<typeof invoiceCustomerSchema>
