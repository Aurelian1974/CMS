import { useQuery } from '@tanstack/react-query'
import { securityEventsApi } from '@/api/endpoints/securityEvents.api'
import type { SecurityEventFilters } from '../types/audit.types'

export const useSecurityEvents = (filters: SecurityEventFilters) =>
  useQuery({
    queryKey: ['security-events', filters],
    queryFn: async () => (await securityEventsApi.getPaged(filters)).data!,
    // Jurnalul e o interogare de investigație: pagina anterioară rămâne vizibilă
    // cât timp se încarcă următoarea, ca tabelul să nu clipească la fiecare filtru.
    placeholderData: (prev) => prev,
  })
