import type { BadgeVariant } from '@/components/ui/AppBadge'

export const getAppointmentStatusVariant = (code: string | null): BadgeVariant => {
  if (!code) return 'neutral'
  switch (code.toUpperCase()) {
    case 'PROGRAMAT':  return 'info'
    case 'CONFIRMAT':  return 'primary'
    case 'FINALIZAT':  return 'success'
    case 'ANULAT':     return 'danger'
    default:           return 'neutral'
  }
}

export const getConsultationStatusVariant = (code: string | null): BadgeVariant => {
  if (!code) return 'neutral'
  switch (code.toUpperCase()) {
    case 'INLUCRU':    return 'warning'
    case 'FINALIZATA': return 'success'
    case 'FACTURATA':  return 'info'
    case 'BLOCATA':    return 'danger'
    default:           return 'neutral'
  }
}

/** Eticheta scurtă a diagnosticului: cod ICD-10 principal sau începutul textului liber. */
export function parseDiagnosticLabel(raw: string | null): string {
  if (!raw) return '—'
  try {
    const data = JSON.parse(raw)
    if (data?.primaryCode?.code) {
      return `${data.primaryCode.code} — ${data.primaryCode.shortDescriptionRo ?? ''}`
    }
  } catch { /* not JSON */ }
  return raw.length > 55 ? raw.substring(0, 55) + '…' : raw
}

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' })

export const formatTimeRange = (start: string, end: string) => `${formatTime(start)} - ${formatTime(end)}`

export const ageFromBirthDate = (birthDate: string | null): number | null => {
  if (!birthDate) return null
  const birth = new Date(birthDate)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export const genderLabel = (code: string | null) =>
  code === 'M' ? 'Masculin' : code === 'F' ? 'Feminin' : null
