/// Tipuri pentru jurnalul de evenimente de securitate.

export interface SecurityEvent {
  id: string
  eventType: string
  /** Null când utilizatorul nu a putut fi identificat — login eșuat cu email necunoscut. */
  userId: string | null
  userName: string | null
  clinicId: string | null
  /** Valoarea introdusă în formular la un login eșuat. */
  emailAttempted: string | null
  ipAddress: string | null
  userAgent: string | null
  succeeded: boolean
  details: string | null
  occurredAt: string
}

export interface SecurityEventPagedResult {
  items: SecurityEvent[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

export interface SecurityEventFilters {
  eventType?: string
  emailAttempted?: string
  ipAddress?: string
  succeeded?: boolean
  dateFrom?: string
  dateTo?: string
  page: number
  pageSize: number
}

/// Tipurile emise de backend (SecurityEventTypes.cs). Lista e fixă: valorile ajung
/// ca atare în baza de date, deci nu se redenumesc fără migrare.
export const EVENT_TYPES = [
  'LoginSucceeded',
  'LoginFailed',
  'AccountLocked',
  'AccountInactive',
  'Logout',
  'TokenRefreshed',
  'TokenReuseDetected',
  'SessionExpiredIdle',
  'PasswordChanged',
  'PasswordReset',
  'SecuritySettingsChanged',
] as const

/// Etichete în română pentru afișare.
export const EVENT_LABELS: Record<string, string> = {
  LoginSucceeded:          'Autentificare reușită',
  LoginFailed:             'Autentificare eșuată',
  AccountLocked:           'Cont blocat',
  AccountInactive:         'Cont dezactivat',
  Logout:                  'Deconectare',
  TokenRefreshed:          'Sesiune reîmprospătată',
  TokenReuseDetected:      'Reutilizare token detectată',
  SessionExpiredIdle:      'Expirare din inactivitate',
  PasswordChanged:         'Parolă schimbată',
  PasswordReset:           'Parolă resetată de administrator',
  SecuritySettingsChanged: 'Setări de securitate modificate',
}

/// Evenimentele care cer atenție imediată. `TokenReuseDetected` înseamnă că o copie
/// a unui refresh token a circulat — semnalul clasic de furt de sesiune.
export const CRITICAL_EVENTS = new Set(['TokenReuseDetected'])
