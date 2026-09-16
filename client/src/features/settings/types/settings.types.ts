/// Tipuri pentru ecranul de administrare a politicilor de securitate.

export interface GlobalSecuritySettings {
  passwordMinLength: number
  passwordMaxLength: number
  passwordMinDigits: number
  passwordMinSpecial: number
  passwordMinUppercase: number
  passwordMinLowercase: number
  /** Lista de parole frecvente — nu poate fi dezactivată, deci e read-only în UI. */
  passwordBlocklistEnabled: boolean
  passwordForbidIdentityValues: boolean
  /** 0 = fără istoric. */
  passwordHistoryCount: number
  /** 0 = fără expirare. */
  passwordExpiryDays: number
  maxFailedLoginAttempts: number
  lockoutMinutes: number
  securityEventRetentionDays: number
  refreshTokenRetentionDays: number
  updatedAt?: string | null
  updatedBy?: string | null
}

export interface RoleSessionSettings {
  roleId: string
  roleCode: string
  roleName: string
  idleTimeoutMinutes: number
  refreshTokenDays: number
}

/// Pragurile impuse în cod. Vin de la server ca formularul să valideze cu aceleași
/// valori — altfel clientul și serverul ar avea două adevăruri diferite.
export interface SecurityLimits {
  minPasswordLength: number
  maxPasswordLength: number
  minFailedLoginAttempts: number
  minLockoutMinutes: number
  minSecurityEventRetentionDays: number
  minRefreshTokenRetentionDays: number
  minIdleTimeoutMinutes: number
  maxIdleTimeoutMinutes: number
  minRefreshTokenDays: number
  maxRefreshTokenDays: number
}

export interface SecuritySettingsView {
  global: GlobalSecuritySettings
  roles: RoleSessionSettings[]
  limits: SecurityLimits
}
