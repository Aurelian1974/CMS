import api from '@/api/axiosInstance'
import type { ApiResponse } from '@/types/common.types'
import type {
  CnasSyncStatusDto,
  CnasSyncHistoryDto,
  CnasSyncStatsDto,
  CnasDrugDto,
  CnasCompensatedDrugDto,
  CnasActiveSubstanceDto,
  CnasAtcCodeDto,
  CnasIcd10Dto,
  CnasPagedResult,
  GetCnasDrugsParams,
  GetCnasCompensatedParams,
  GetCnasPagedParams,
} from '@/features/cnas/types/cnas.types'

export const cnasApi = {
  /** Declanșează o sincronizare manuală; returnează jobId (string uuid). */
  triggerSync: (): Promise<ApiResponse<string>> =>
    api.post('/api/cnas/sync'),

  /** Polling — statusul unui job de sincronizare. */
  getSyncStatus: (jobId: string): Promise<ApiResponse<CnasSyncStatusDto>> =>
    api.get(`/api/cnas/sync/${jobId}`),

  /** Istoricul sincronizărilor (implicit ultimele 10). */
  getSyncHistory: (count = 10): Promise<ApiResponse<CnasSyncHistoryDto[]>> =>
    api.get('/api/cnas/sync/history', { params: { count } }),

  /** Statistici nomenclator curent (număr medicamente, ultima sincronizare). */
  getStats: (): Promise<ApiResponse<CnasSyncStatsDto>> =>
    api.get('/api/cnas/stats'),

  // ── Nomenclator ──────────────────────────────────────────────────────────────

  getDrugs: (params: GetCnasDrugsParams): Promise<ApiResponse<CnasPagedResult<CnasDrugDto>>> =>
    api.get('/api/cnas/drugs', { params }),

  getCompensated: (params: GetCnasCompensatedParams): Promise<ApiResponse<CnasPagedResult<CnasCompensatedDrugDto>>> =>
    api.get('/api/cnas/compensated', { params }),

  getActiveSubstances: (params: GetCnasPagedParams): Promise<ApiResponse<CnasPagedResult<CnasActiveSubstanceDto>>> =>
    api.get('/api/cnas/active-substances', { params }),

  getAtcCodes: (params: GetCnasPagedParams): Promise<ApiResponse<CnasPagedResult<CnasAtcCodeDto>>> =>
    api.get('/api/cnas/atc', { params }),

  getIcd10Codes: (params: GetCnasPagedParams): Promise<ApiResponse<CnasPagedResult<CnasIcd10Dto>>> =>
    api.get('/api/cnas/icd10', { params }),
}
