import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email-ul este obligatoriu.')
    .email('Adresa de email nu este validă.'),
  password: z
    .string()
    .min(1, 'Parola este obligatorie.'),
  rememberMe: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
