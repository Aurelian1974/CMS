import { z } from 'zod'

// Aceleași limite ca FluentValidation în backend (CreateMedicalServiceCommandValidator)
const price = z.coerce
  .number({ error: 'Prețul trebuie să fie un număr' })
  .min(0, 'Prețul nu poate fi negativ')
  .max(9_999_999.99, 'Prețul depășește valoarea maximă permisă')
  .refine((v) => Math.abs(v * 100 - Math.round(v * 100)) < 1e-6, 'Prețul poate avea cel mult 2 zecimale')

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data este obligatorie')

export const medicalServiceSchema = z.object({
  code: z.string().trim().min(1, 'Codul este obligatoriu').max(30, 'Codul nu poate depăși 30 de caractere'),
  name: z.string().trim().min(1, 'Denumirea este obligatorie').max(200, 'Denumirea nu poate depăși 200 de caractere'),
  categoryId: z.string().min(1, 'Categoria este obligatorie'),
  durationMinutes: z.union([
    z.literal(''),
    z.coerce.number().int('Durata trebuie să fie un număr întreg').min(1, 'Minim 1 minut').max(1440, 'Maxim 1440 de minute'),
  ]),
  investigationTypeCode: z.string(),
  // Doar la creare — la editare prețul se schimbă din istoricul de prețuri
  price,
  vatRateId: z.string().min(1, 'Regimul TVA este obligatoriu'),
  validFrom: isoDate,
})

export type MedicalServiceFormData = z.infer<typeof medicalServiceSchema>

export const medicalServicePriceSchema = z.object({
  price,
  vatRateId: z.string().min(1, 'Regimul TVA este obligatoriu'),
  validFrom: isoDate,
})

export type MedicalServicePriceFormData = z.infer<typeof medicalServicePriceSchema>

// Categoriile E / O / Z (UBL) nu au TVA — aceeași regulă ca în CreateVatRateCommandValidator
export const vatRateSchema = z.object({
  code: z.string().trim().min(1, 'Codul este obligatoriu').max(30, 'Codul nu poate depăși 30 de caractere'),
  name: z.string().trim().min(1, 'Denumirea este obligatorie').max(150, 'Denumirea nu poate depăși 150 de caractere'),
  percent: z.coerce.number({ error: 'Cota trebuie să fie un număr' }).min(0, 'Minim 0%').max(99.99, 'Maxim 99,99%'),
  ublCategoryCode: z.string().min(1, 'Categoria este obligatorie'),
  exemptionReasonCode: z.string().max(30, 'Maxim 30 de caractere'),
  exemptionReasonText: z.string().max(300, 'Maxim 300 de caractere'),
  isActive: z.boolean(),
}).refine((v) => !['E', 'O', 'Z'].includes(v.ublCategoryCode) || v.percent === 0, {
  path: ['percent'], message: 'Regimurile scutite / în afara sferei au cota 0%',
})

export type VatRateFormData = z.infer<typeof vatRateSchema>

// Import 1:1: se creează toate serviciile lipsă; prețul e opțional și se validează doar pe rândurile noi
// (aceeași regulă ca ImportInvestigationServicesCommandValidator)
export const importInvestigationsSchema = z.object({
  vatRateId: z.string(),
  validFrom: isoDate,
  rows: z.array(z.object({
    typeCode: z.string(),
    isNew: z.boolean(),
    price: z.string(),
  })),
}).superRefine((v, ctx) => {
  let hasPrice = false
  v.rows.forEach((r, i) => {
    if (!r.isNew || r.price.trim() === '') return
    hasPrice = true
    const parsed = price.safeParse(r.price)
    if (!parsed.success) {
      ctx.addIssue({ code: 'custom', path: ['rows', i, 'price'], message: parsed.error.issues[0]?.message ?? 'Preț invalid' })
    }
  })

  if (hasPrice && !v.vatRateId) {
    ctx.addIssue({ code: 'custom', path: ['vatRateId'], message: 'Regimul TVA este obligatoriu când se completează prețuri' })
  }
})

export type ImportInvestigationsFormData = z.infer<typeof importInvestigationsSchema>
