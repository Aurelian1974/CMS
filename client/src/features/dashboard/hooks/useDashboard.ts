import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/api/endpoints/dashboard.api'
import type { GetDashboardParams } from '../types/dashboard.types'

export const dashboardKeys = {
  all:  ['dashboard'] as const,
  view: (params: GetDashboardParams) => [...dashboardKeys.all, 'view', params] as const,
}

/**
 * Un singur query: compoziția (ce widget-uri, ce date) o decide serverul, pe baza
 * permisiunilor efective. Clientul nu cere secțiuni — doar le afișează.
 */
export const useDashboard = (params: GetDashboardParams = {}) =>
  useQuery({
    queryKey: dashboardKeys.view(params),
    queryFn: () => dashboardApi.get(params),
    staleTime: 60_000,
    // Consultațiile finalizate de medic trebuie să apară la recepție fără reîncărcare manuală
    refetchInterval: 60_000,
    placeholderData: keepPreviousData,
  })
