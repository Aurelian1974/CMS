import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type { DashboardDto, GetDashboardParams } from '@/features/dashboard/types/dashboard.types'

const DASHBOARD = '/api/v1/Dashboard'

export const dashboardApi = {
  get: (params: GetDashboardParams): Promise<ApiResponse<DashboardDto>> =>
    api.get(DASHBOARD, { params }),
}
