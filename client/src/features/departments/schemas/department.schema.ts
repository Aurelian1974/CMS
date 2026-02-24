import { z } from 'zod'

/// Schema validare formular departament
export const departmentSchema = z.object({
  locationId: z
    .string()
    .min(1, 'Locația este obligatorie'),
  name: z
    .string()
    .min(1, 'Denumirea departamentului este obligatorie')
    .max(200, 'Denumirea nu poate depăși 200 de caractere'),
  code: z
    .string()
    .min(1, 'Codul departamentului este obligatoriu')
    .max(20, 'Codul nu poate depăși 20 de caractere')
    .regex(/^[A-Z0-9_-]+$/, 'Codul poate conține doar litere mari, cifre, - și _'),
  description: z
    .string()
    .max(500, 'Descrierea nu poate depăși 500 de caractere'),
  isActive: z.boolean(),
})

export type DepartmentFormData = z.infer<typeof departmentSchema>
