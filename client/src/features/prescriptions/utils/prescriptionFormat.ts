import type { BadgeVariant } from '@/components/ui/AppBadge'
import { PRESCRIPTION_STATUS } from '../types/prescription.types'

const doseFormatter = new Intl.NumberFormat('ro-RO', { maximumFractionDigits: 2 })

export const formatDose = (value: number | null | undefined): string =>
  value == null ? '' : doseFormatter.format(value)

/** „RC 12" sau „Ciornă" când rețeta nu a fost încă emisă. */
export const formatSeriesNumber = (series: string | null, number: number | null): string =>
  number == null ? 'Ciornă' : `${series ?? ''} ${number}`.trim()

export const statusBadgeVariant = (statusCode: string): BadgeVariant => {
  switch (statusCode) {
    case PRESCRIPTION_STATUS.Draft:       return 'neutral'
    case PRESCRIPTION_STATUS.Issued:      return 'primary'
    case PRESCRIPTION_STATUS.Transmitted: return 'info'
    case PRESCRIPTION_STATUS.Dispensed:   return 'success'
    case PRESCRIPTION_STATUS.Cancelled:   return 'danger'
    default:                              return 'neutral'
  }
}

interface PosologySource {
  doseMorning: number | null
  doseAfternoon: number | null
  doseEvening: number | null
  durationDays: number | null
  instructions?: string | null
}

/** Modul de administrare (D.S.): doze pe momentele zilei, durata și indicațiile. */
export const formatPosology = (item: PosologySource): string => {
  const doses = [
    item.doseMorning   != null ? `dimineața ${formatDose(item.doseMorning)}`   : null,
    item.doseAfternoon != null ? `la prânz ${formatDose(item.doseAfternoon)}`  : null,
    item.doseEvening   != null ? `seara ${formatDose(item.doseEvening)}`       : null,
  ].filter(Boolean)

  const parts = [
    doses.length > 0 ? doses.join(', ') : null,
    item.durationDays != null ? `${item.durationDays} zile` : null,
    item.instructions?.trim() || null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' — ') : '—'
}

/** Cantitatea implicită: suma dozelor zilnice × zile (aceeași regulă ca în BD). */
export const computeQuantity = (item: PosologySource): number | null => {
  const daily = (item.doseMorning ?? 0) + (item.doseAfternoon ?? 0) + (item.doseEvening ?? 0)
  return daily > 0 && item.durationDays ? Math.round(daily * item.durationDays * 100) / 100 : null
}
