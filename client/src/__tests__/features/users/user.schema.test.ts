import { describe, expect, it } from 'vitest'
import { buildCreateUserSchema, updateUserSchema } from '@/features/users/schemas/user.schema'
import type { PasswordPolicyDto } from '@/features/users/types/user.types'

const policy: PasswordPolicyDto = {
  minLength: 12,
  maxLength: 100,
  minDigits: 0,
  minSpecial: 0,
  minUppercase: 0,
  minLowercase: 0,
  forbidIdentityValues: true,
}

const validUser = {
  roleId: 'D1000001-0000-0000-0000-000000000004',
  associationType: 'administrativeStaff' as const,
  doctorId: '',
  medicalStaffId: '',
  administrativeStaffId: 'AD000001-0000-0000-0000-0000000000A1',
  username: 'ana.ionescu',
  email: 'ana.ionescu@clinica.ro',
  password: 'Ploaie-Verde-Munte',
  confirmPassword: 'Ploaie-Verde-Munte',
  firstName: 'Ana',
  lastName: 'Ionescu',
  isActive: true,
}

const issuesFor = (result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }, field: string) =>
  result.error?.issues.filter(i => i.path[0] === field).map(i => i.message) ?? []

describe('buildCreateUserSchema', () => {
  it('should accept a user associated with administrative staff', () => {
    expect(buildCreateUserSchema(policy).safeParse(validUser).success).toBe(true)
  })

  it('should use the minimum length from the security settings', () => {
    const result = buildCreateUserSchema({ ...policy, minLength: 20 }).safeParse(validUser)
    expect(issuesFor(result, 'password')).toContain('Parola trebuie să aibă minimum 20 caractere')
  })

  it('should enforce composition rules from the policy', () => {
    const result = buildCreateUserSchema({ ...policy, minDigits: 2, minUppercase: 1 })
      .safeParse({ ...validUser, password: 'ploaie-verde-munte', confirmPassword: 'ploaie-verde-munte' })
    const messages = issuesFor(result, 'password')
    expect(messages).toContain('Parola trebuie să conțină cel puțin 2 cifre')
    expect(messages).toContain('Parola trebuie să conțină cel puțin 1 literă mare')
  })

  it('should reject a password equal to the username when the policy forbids it', () => {
    const result = buildCreateUserSchema(policy).safeParse({
      ...validUser, username: 'ana.ionescu.2026', password: 'ana.ionescu.2026', confirmPassword: 'ana.ionescu.2026',
    })
    expect(issuesFor(result, 'password').length).toBeGreaterThan(0)
  })

  it('should report the missing association on the selected dropdown', () => {
    const result = buildCreateUserSchema(policy).safeParse({ ...validUser, administrativeStaffId: '' })
    expect(issuesFor(result, 'administrativeStaffId').length).toBe(1)
    expect(issuesFor(result, 'doctorId').length).toBe(0)
  })

  it('should reject mismatched password confirmation', () => {
    const result = buildCreateUserSchema(policy).safeParse({ ...validUser, confirmPassword: 'altceva-complet' })
    expect(issuesFor(result, 'confirmPassword')).toContain('Parolele nu coincid')
  })
})

describe('updateUserSchema', () => {
  it('should not require a password', () => {
    const withoutPassword = { ...validUser, password: undefined, confirmPassword: undefined }
    expect(updateUserSchema.safeParse(withoutPassword).success).toBe(true)
  })
})
