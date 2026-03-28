import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  AnmSyncStatusDto,
  AnmSyncHistoryDto,
  AnmSyncStatsDto,
  AnmDrugDto,
  AnmPagedResult,
  GetAnmDrugsParams,
} from '@/features/anm/types/anm.types'

export const anmApi = {
  /** Declanșează o sincronizare manuală; returnează jobId. */
  triggerSync: (): Promise<ApiResponse<string>> =>
    api.post('/api/v1/Anm/sync'),

  /** Polling — statusul unui job de sincronizare. */
  getSyncStatus: (jobId: string): Promise<ApiResponse<AnmSyncStatusDto>> =>
    api.get(`/api/v1/Anm/sync/${jobId}`),

  /** Istoricul sincronizărilor (implicit ultimele 10). */
  getSyncHistory: (count = 10): Promise<ApiResponse<AnmSyncHistoryDto[]>> =>
    api.get('/api/v1/Anm/sync/history', { params: { count } }),

  /** Statistici curent (număr medicamente, ultima sincronizare). */
  getStats: (): Promise<ApiResponse<AnmSyncStatsDto>> =>
    api.get('/api/v1/Anm/stats'),

  /** Listare paginată medicamente ANM. */
  getDrugs: (params: GetAnmDrugsParams): Promise<ApiResponse<AnmPagedResult<AnmDrugDto>>> =>
    api.get('/api/v1/Anm/drugs', { params }),
}
