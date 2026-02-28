import { z } from 'zod'

/// Schema validare creare/editare specializare
export const specialtySchema = z.object({
  parentId: z.string().uuid().nullable(),
  name: z
    .string()
    .min(1, 'Denumirea este obligatorie')
    .max(150, 'Denumirea nu poate depăși 150 de caractere'),
  code: z
    .string()
    .min(1, 'Codul este obligatoriu')
    .max(20, 'Codul nu poate depăși 20 de caractere')
    .regex(/^[A-Z0-9_]+$/, 'Codul poate conține doar litere mari, cifre și underscore'),
  description: z
    .string()
    .max(500, 'Descrierea nu poate depăși 500 de caractere')
    .nullable()
    .transform((v) => v || null),
  displayOrder: z
    .coerce.number({ invalid_type_error: 'Ordinea trebuie să fie un număr' })
    .int('Ordinea trebuie să fie un număr întreg')
    .min(0, 'Ordinea nu poate fi negativă'),
  level: z
    .number()
    .int()
    .min(0, 'Nivelul minim este 0')
    .max(2, 'Nivelul maxim este 2'),
})

export type SpecialtyFormData = z.infer<typeof specialtySchema>
