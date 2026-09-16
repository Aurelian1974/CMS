import { z } from 'zod'

/// Schema Zod — creare utilizator
export const createUserSchema = z.object({
  roleId:           z.string().min(1, 'Rolul este obligatoriu'),
  associationType:  z.enum(['doctor', 'medicalStaff'], { error: 'Selectați tipul asocierii' }),
  doctorId:         z.string().optional().or(z.literal('')),
  medicalStaffId:   z.string().optional().or(z.literal('')),
  username:         z.string().min(1, 'Username-ul este obligatoriu').max(100, 'Maxim 100 caractere')
                      .regex(/^[a-zA-Z0-9._-]+$/, 'Doar litere, cifre, puncte, cratime și underscore'),
  email:            z.string().min(1, 'Email-ul este obligatoriu').email('Email invalid').max(200, 'Maxim 200 caractere'),
  password:         z.string().min(6, 'Parola trebuie să aibă minimum 6 caractere').max(100, 'Maxim 100 caractere'),
  confirmPassword:  z.string().min(1, 'Confirmarea parolei este obligatorie'),
  firstName:        z.string().min(1, 'Prenumele este obligatoriu').max(100, 'Maxim 100 caractere'),
  lastName:         z.string().min(1, 'Numele este obligatoriu').max(100, 'Maxim 100 caractere'),
  isActive:         z.boolean(),
}).refine(
  (data) => {
    if (data.associationType === 'doctor') return !!data.doctorId
    return !!data.medicalStaffId
  },
  { message: 'Selectați doctorul sau personalul medical asociat', path: ['doctorId'] }
).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Parolele nu coincid', path: ['confirmPassword'] }
)

/// Schema Zod — editare utilizator (fără parolă obligatorie)
export const updateUserSchema = z.object({
  roleId:           z.string().min(1, 'Rolul este obligatoriu'),
  associationType:  z.enum(['doctor', 'medicalStaff'], { error: 'Selectați tipul asocierii' }),
  doctorId:         z.string().optional().or(z.literal('')),
  medicalStaffId:   z.string().optional().or(z.literal('')),
  username:         z.string().min(1, 'Username-ul este obligatoriu').max(100, 'Maxim 100 caractere')
                      .regex(/^[a-zA-Z0-9._-]+$/, 'Doar litere, cifre, puncte, cratime și underscore'),
  email:            z.string().min(1, 'Email-ul este obligatoriu').email('Email invalid').max(200, 'Maxim 200 caractere'),
  firstName:        z.string().min(1, 'Prenumele este obligatoriu').max(100, 'Maxim 100 caractere'),
  lastName:         z.string().min(1, 'Numele este obligatoriu').max(100, 'Maxim 100 caractere'),
  isActive:         z.boolean(),
}).refine(
  (data) => {
    if (data.associationType === 'doctor') return !!data.doctorId
    return !!data.medicalStaffId
  },
  { message: 'Selectați doctorul sau personalul medical asociat', path: ['doctorId'] }
)

/// Schema Zod — schimbare parolă
/// Politica trebuie să rămână aliniată cu PasswordRules din backend.
/// Validarea din client e doar pentru feedback imediat — backendul o reaplică.
const MIN_PASSWORD_LENGTH = 12

const newPasswordField = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Parola trebuie să aibă minimum ${MIN_PASSWORD_LENGTH} caractere`)
  .max(100, 'Maxim 100 caractere')

/// Reset administrativ — fără parola curentă, adminul nu o cunoaște
export const resetPasswordSchema = z.object({
  newPassword:     newPasswordField,
  confirmPassword: z.string().min(1, 'Confirmarea parolei este obligatorie'),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: 'Parolele nu coincid', path: ['confirmPassword'] }
)

/// Schimbare proprie — parola curentă e obligatorie
export const changeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Parola curentă este obligatorie'),
  newPassword:     newPasswordField,
  confirmPassword: z.string().min(1, 'Confirmarea parolei este obligatorie'),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: 'Parolele nu coincid', path: ['confirmPassword'] }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  { message: 'Parola nouă trebuie să fie diferită de cea curentă', path: ['newPassword'] }
)

export type CreateUserFormData = z.infer<typeof createUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
export type ResetPasswordFormData    = z.infer<typeof resetPasswordSchema>
export type ChangeOwnPasswordFormData = z.infer<typeof changeOwnPasswordSchema>
