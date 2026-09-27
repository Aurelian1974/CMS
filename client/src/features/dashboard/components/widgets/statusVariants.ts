import type { BadgeVariant } from '@/components/ui/AppBadge/AppBadge.types'

/** Doar culoarea e decizie de client; eticheta vine din nomenclatorul de pe server. */
export const APPOINTMENT_STATUS_VARIANT: Record<string, BadgeVariant> = {
  PROGRAMAT:    'info',
  CONFIRMAT:    'primary',
  FINALIZAT:    'success',
  ANULAT:       'neutral',
  NEPREZENTARE: 'danger',
}
