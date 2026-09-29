import { z } from 'zod'
import type { PasswordPolicyDto, UserAssociationType } from '../types/user.types'

/// Câmpul de formular care ține persoana asociată, per tip de asociere
export const ASSOCIATION_FIELD = {
  doctor:              'doctorId',
  medicalStaff:        'medicalStaffId',
  administrativeStaff: 'administrativeStaffId',
} as const satisfies Record<UserAssociationType, string>

const ASSOCIATION_MESSAGE: Record<UserAssociationType, string> = {
  doctor:              'Selectați doctorul asociat',
  medicalStaff:        'Selectați membrul personalului medical asociat',
  administrativeStaff: 'Selectați membrul personalului administrativ asociat',
}

const baseUserFields = {
  roleId:                z.string().min(1, 'Rolul este obligatoriu'),
  associationType:       z.enum(['doctor', 'medicalStaff', 'administrativeStaff'], { error: 'Selectați tipul asocierii' }),
  doctorId:              z.string().optional().or(z.literal('')),
  medicalStaffId:        z.string().optional().or(z.literal('')),
  administrativeStaffId: z.string().optional().or(z.literal('')),
  username:              z.string().min(1, 'Username-ul este obligatoriu').max(100, 'Maxim 100 caractere')
                           .regex(/^[a-zA-Z0-9._-]+$/, 'Doar litere, cifre, puncte, cratime și underscore'),
  email:                 z.string().min(1, 'Email-ul este obligatoriu').email('Email invalid').max(200, 'Maxim 200 caractere'),
  firstName:             z.string().min(1, 'Prenumele este obligatoriu').max(100, 'Maxim 100 caractere'),
  lastName:              z.string().min(1, 'Numele este obligatoriu').max(100, 'Maxim 100 caractere'),
  isActive:              z.boolean(),
}

type AssociationData = {
  associationType: UserAssociationType
  doctorId?: string
  medicalStaffId?: string
  administrativeStaffId?: string
}

/// Eroarea apare pe dropdown-ul vizibil, nu mereu pe doctorId
const checkAssociation = (data: AssociationData, ctx: z.RefinementCtx) => {
  const field = ASSOCIATION_FIELD[data.associationType]
  if (!data[field]) {
    ctx.addIssue({ code: 'custom', message: ASSOCIATION_MESSAGE[data.associationType], path: [field] })
  }
}

/// Caracter special = nici literă, nici cifră (identic cu PasswordRules.IsSpecial din backend)
const countMatches = (value: string, pattern: RegExp) => (value.match(pattern) ?? []).length

const requireCount = (count: number, singular: string, plural: string) =>
  `Parola trebuie să conțină cel puțin ${count} ${count === 1 ? singular : plural}`

/// Câmpul parolă construit din politica din Setări securitate.
/// Backend-ul reaplică politica (inclusiv lista de parole frecvente), deci aici e doar feedback imediat.
const passwordField = (policy: PasswordPolicyDto | undefined) => {
  const minLength = policy?.minLength ?? 1
  const maxLength = policy?.maxLength ?? 100

  return z.string()
    .min(1, 'Parola este obligatorie')
    .min(minLength, `Parola trebuie să aibă minimum ${minLength} caractere`)
    .max(maxLength, `Parola nu poate depăși ${maxLength} de caractere`)
    .superRefine((value, ctx) => {
      if (!policy || !value) return
      const rules: Array<[number, number, string, string]> = [
        [countMatches(value, /\p{Nd}/gu),          policy.minDigits,    'cifră',            'cifre'],
        [countMatches(value, /[^\p{L}\p{Nd}]/gu),  policy.minSpecial,   'caracter special', 'caractere speciale'],
        [countMatches(value, /\p{Lu}/gu),          policy.minUppercase, 'literă mare',      'litere mari'],
        [countMatches(value, /\p{Ll}/gu),          policy.minLowercase, 'literă mică',      'litere mici'],
      ]
      for (const [actual, required, singular, plural] of rules) {
        if (required > 0 && actual < required) {
          ctx.addIssue({ code: 'custom', message: requireCount(required, singular, plural) })
        }
      }
    })
}

/// Valorile publice ale contului (email, username, nume) — comparate ca în PasswordPolicyChecker din backend
export type IdentityValues = ReadonlyArray<string | null | undefined>

const checkIdentity = (
  policy: PasswordPolicyDto | undefined,
  password: string,
  identity: IdentityValues,
  path: string[],
  ctx: z.RefinementCtx,
) => {
  if (!policy?.forbidIdentityValues || !password) return
  const lowered = password.toLowerCase()
  if (identity.some(v => v && v.trim().toLowerCase() === lowered)) {
    ctx.addIssue({
      code: 'custom',
      message: 'Parola nu poate fi identică cu emailul, username-ul sau numele contului',
      path,
    })
  }
}

/// Schema Zod — creare utilizator; parola urmează politica activă
export const buildCreateUserSchema = (policy: PasswordPolicyDto | undefined) =>
  z.object({
    ...baseUserFields,
    password:        passwordField(policy),
    confirmPassword: z.string().min(1, 'Confirmarea parolei este obligatorie'),
  })
    .superRefine(checkAssociation)
    .superRefine((data, ctx) => {
      if (data.password !== data.confirmPassword) {
        ctx.addIssue({ code: 'custom', message: 'Parolele nu coincid', path: ['confirmPassword'] })
      }
      checkIdentity(policy, data.password, [data.email, data.username, data.firstName, data.lastName], ['password'], ctx)
    })

/// Schema Zod — editare utilizator (fără parolă)
export const updateUserSchema = z.object(baseUserFields).superRefine(checkAssociation)

/// Cerințele politicii, afișate sub câmpul de parolă
export const describePasswordPolicy = (p: PasswordPolicyDto): string => {
  const parts = [`minimum ${p.minLength} caractere`]
  if (p.minDigits > 0)    parts.push(`${p.minDigits} ${p.minDigits === 1 ? 'cifră' : 'cifre'}`)
  if (p.minUppercase > 0) parts.push(`${p.minUppercase} ${p.minUppercase === 1 ? 'literă mare' : 'litere mari'}`)
  if (p.minLowercase > 0) parts.push(`${p.minLowercase} ${p.minLowercase === 1 ? 'literă mică' : 'litere mici'}`)
  if (p.minSpecial > 0)   parts.push(`${p.minSpecial} ${p.minSpecial === 1 ? 'caracter special' : 'caractere speciale'}`)
  if (p.forbidIdentityValues) parts.push('diferită de email, username și nume')
  return `Cerințe: ${parts.join(' · ')}`
}

/// Reset administrativ — fără parola curentă, adminul nu o cunoaște
export const buildResetPasswordSchema = (policy: PasswordPolicyDto | undefined, identity: IdentityValues = []) =>
  z.object({
    newPassword:     passwordField(policy),
    confirmPassword: z.string().min(1, 'Confirmarea parolei este obligatorie'),
  }).superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({ code: 'custom', message: 'Parolele nu coincid', path: ['confirmPassword'] })
    }
    checkIdentity(policy, data.newPassword, identity, ['newPassword'], ctx)
  })

/// Schimbare proprie — parola curentă e obligatorie
export const buildChangeOwnPasswordSchema = (policy: PasswordPolicyDto | undefined, identity: IdentityValues = []) =>
  z.object({
    currentPassword: z.string().min(1, 'Parola curentă este obligatorie'),
    newPassword:     passwordField(policy),
    confirmPassword: z.string().min(1, 'Confirmarea parolei este obligatorie'),
  }).superRefine((data, ctx) => {
    if (data.newPassword !== data.confirmPassword) {
      ctx.addIssue({ code: 'custom', message: 'Parolele nu coincid', path: ['confirmPassword'] })
    }
    if (data.currentPassword && data.currentPassword === data.newPassword) {
      ctx.addIssue({ code: 'custom', message: 'Parola nouă trebuie să fie diferită de cea curentă', path: ['newPassword'] })
    }
    checkIdentity(policy, data.newPassword, identity, ['newPassword'], ctx)
  })

export type CreateUserFormData = z.infer<ReturnType<typeof buildCreateUserSchema>>
export type UpdateUserFormData = z.infer<typeof updateUserSchema>
export type ResetPasswordFormData    = z.infer<ReturnType<typeof buildResetPasswordSchema>>
export type ChangeOwnPasswordFormData = z.infer<ReturnType<typeof buildChangeOwnPasswordSchema>>
