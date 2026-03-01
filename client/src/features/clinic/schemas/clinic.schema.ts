import { z } from 'zod'

/// Schema validare formular clinică (societate comercială)
export const clinicSchema = z.object({
  name: z
    .string()
    .min(1, 'Denumirea societății este obligatorie')
    .max(200, 'Denumirea nu poate depăși 200 de caractere'),
  fiscalCode: z
    .string()
    .min(1, 'CUI/CIF-ul este obligatoriu')
    .max(20, 'CUI/CIF-ul nu poate depăși 20 de caractere'),
  tradeRegisterNumber: z
    .string()
    .max(30, 'Nr. Registrul Comerțului nu poate depăși 30 de caractere')
    .optional()
    .transform(v => v || null),
  caenCodes: z
    .array(
      z.object({
        id: z.string(),
        code: z.string(),
        name: z.string(),
        level: z.number().int(),
        isActive: z.boolean(),
      }),
    )
    .default([]),
  legalRepresentative: z
    .string()
    .max(200, 'Numele reprezentantului legal nu poate depăși 200 de caractere')
    .optional()
    .transform(v => v || null),
  contractCNAS: z
    .string()
    .max(50, 'Numărul contractului CNAS nu poate depăși 50 de caractere')
    .optional()
    .transform(v => v || null),
  address: z
    .string()
    .min(1, 'Adresa sediului social este obligatorie')
    .max(500, 'Adresa nu poate depăși 500 de caractere'),
  city: z
    .string()
    .min(1, 'Orașul este obligatoriu')
    .max(100, 'Orașul nu poate depăși 100 de caractere'),
  county: z
    .string()
    .min(1, 'Județul este obligatoriu')
    .max(100, 'Județul nu poate depăși 100 de caractere'),
  postalCode: z
    .string()
    .regex(/^\d{6}$/, 'Codul poștal trebuie să conțină 6 cifre')
    .optional()
    .or(z.literal(''))
    .transform(v => v || null),
  bankName: z
    .string()
    .max(100, 'Numele băncii nu poate depăși 100 de caractere')
    .optional()
    .transform(v => v || null),
  bankAccount: z
    .string()
    .max(34, 'IBAN-ul nu poate depăși 34 de caractere')
    .optional()
    .transform(v => v || null),
  email: z
    .string()
    .email('Adresa de email nu este validă')
    .optional()
    .or(z.literal(''))
    .transform(v => v || null),
  phoneNumber: z
    .string()
    .max(20, 'Numărul de telefon nu poate depăși 20 de caractere')
    .optional()
    .transform(v => v || null),
  website: z
    .string()
    .max(200, 'Website-ul nu poate depăși 200 de caractere')
    .optional()
    .transform(v => v || null),
})

export type ClinicFormData = z.infer<typeof clinicSchema>

/// Schema validare formular locație
export const clinicLocationSchema = z.object({
  name: z
    .string()
    .min(1, 'Denumirea locației este obligatorie')
    .max(200, 'Denumirea nu poate depăși 200 de caractere'),
  address: z
    .string()
    .min(1, 'Adresa locației este obligatorie')
    .max(500, 'Adresa nu poate depăși 500 de caractere'),
  city: z
    .string()
    .min(1, 'Orașul este obligatoriu')
    .max(100, 'Orașul nu poate depăși 100 de caractere'),
  county: z
    .string()
    .min(1, 'Județul este obligatoriu')
    .max(100, 'Județul nu poate depăși 100 de caractere'),
  postalCode: z
    .string()
    .regex(/^\d{6}$/, 'Codul poștal trebuie să conțină 6 cifre')
    .optional()
    .or(z.literal(''))
    .transform(v => v || null),
  phoneNumber: z
    .string()
    .max(20, 'Numărul de telefon nu poate depăși 20 de caractere')
    .optional()
    .transform(v => v || null),
  email: z
    .string()
    .email('Adresa de email nu este validă')
    .optional()
    .or(z.literal(''))
    .transform(v => v || null),
  isPrimary: z.boolean().default(false),
})

export type ClinicLocationFormData = z.infer<typeof clinicLocationSchema>
