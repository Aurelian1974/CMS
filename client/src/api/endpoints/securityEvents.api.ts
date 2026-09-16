import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  SecurityEventPagedResult,
  SecurityEventFilters,
} from '@/features/audit/types/audit.types'

export const securityEventsApi = {
  getPaged: (filters: SecurityEventFilters): Promise<ApiResponse<SecurityEventPagedResult>> =>
    api.get('/api/v1/SecurityEvents', { params: filters }),
}
