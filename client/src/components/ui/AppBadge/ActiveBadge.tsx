import { AppBadge } from './AppBadge'

interface ActiveBadgeProps {
  isActive: boolean
}

/**
 * Badge standard pentru câmpul isActive — Activ (verde) / Inactiv (gri).
 */
export const ActiveBadge = ({ isActive }: ActiveBadgeProps) => (
  <AppBadge variant={isActive ? 'success' : 'neutral'} withDot>
    {isActive ? 'Activ' : 'Inactiv'}
  </AppBadge>
)
