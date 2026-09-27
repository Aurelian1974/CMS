import { z } from 'zod'

// Aceleași reguli ca UpdateFiscalSettingsCommandValidator / CreateInvoiceSeriesCommandValidator
// Echivalentul Uri.IsLoopback din .NET: 127.0.0.0/8, localhost, ::1
const isLoopbackUrl = (value: string) => {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:')
      && (url.hostname === 'localhost' || url.hostname === '[::1]' || /^127\.\d+\.\d+\.\d+$/.test(url.hostname))
  } catch {
    return false
  }
}

export const fiscalSettingsSchema = z.object({
  isEnabled: z.boolean(),
  isVatPayer: z.boolean(),
  bridgeUrl: z.string().trim().min(1, 'Adresa este obligatorie').max(200, 'Maxim 200 de caractere')
    .refine(isLoopbackUrl, 'Fiscal bridge-ul rulează pe PC-ul local (ex: http://127.0.0.1:5199)'),
  vatMappings: z.array(z.object({
    vatRateId: z.string(),
    taxGroup: z.string().trim().max(5, 'Maxim 5 caractere'),
  })),
  paymentMappings: z.array(z.object({
    paymentMethodId: z.string(),
    devicePaymentCode: z.string().trim().max(5, 'Maxim 5 caractere'),
  })),
})

export type FiscalSettingsFormData = z.infer<typeof fiscalSettingsSchema>

export const invoiceSeriesSchema = z.object({
  series: z.string().trim().regex(/^[A-Za-z0-9]{1,10}$/, 'Seria are 1–10 caractere, doar litere și cifre'),
  startNumber: z.coerce.number({ error: 'Număr invalid' }).int('Număr întreg')
    .min(1, 'Minim 1').max(99_999_999, 'Maxim 99.999.999'),
  isDefault: z.boolean(),
})

export type InvoiceSeriesFormData = z.infer<typeof invoiceSeriesSchema>
