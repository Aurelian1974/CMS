import { z } from 'zod'

/// Schema Zod — creare utilizator
export const createUserSchema = z.object({
  roleId:           z.string().min(1, 'Rolul este obligatoriu'),
  associationType:  z.enum(['doctor', 'medicalStaff'], { required_error: 'Selectați tipul asocierii' }),
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
  associationType:  z.enum(['doctor', 'medicalStaff'], { required_error: 'Selectați tipul asocierii' }),
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
export const changePasswordSchema = z.object({
  newPassword:     z.string().min(6, 'Parola trebuie să aibă minimum 6 caractere').max(100, 'Maxim 100 caractere'),
  confirmPassword: z.string().min(1, 'Confirmarea parolei este obligatorie'),
}).refine(
  (data) => data.newPassword === data.confirmPassword,
  { message: 'Parolele nu coincid', path: ['confirmPassword'] }
)

export type CreateUserFormData = z.infer<typeof createUserSchema>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>
