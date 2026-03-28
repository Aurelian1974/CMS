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
    api.post('/api/v1/Cnas/sync'),

  /** Polling — statusul unui job de sincronizare. */
  getSyncStatus: (jobId: string): Promise<ApiResponse<CnasSyncStatusDto>> =>
    api.get(`/api/v1/Cnas/sync/${jobId}`),

  /** Istoricul sincronizărilor (implicit ultimele 10). */
  getSyncHistory: (count = 10): Promise<ApiResponse<CnasSyncHistoryDto[]>> =>
    api.get('/api/v1/Cnas/sync/history', { params: { count } }),

  /** Statistici nomenclator curent (număr medicamente, ultima sincronizare). */
  getStats: (): Promise<ApiResponse<CnasSyncStatsDto>> =>
    api.get('/api/v1/Cnas/stats'),

  // ── Nomenclator ──────────────────────────────────────────────────────────────

  getDrugs: (params: GetCnasDrugsParams): Promise<ApiResponse<CnasPagedResult<CnasDrugDto>>> =>
    api.get('/api/v1/Cnas/drugs', { params }),

  getCompensated: (params: GetCnasCompensatedParams): Promise<ApiResponse<CnasPagedResult<CnasCompensatedDrugDto>>> =>
    api.get('/api/v1/Cnas/compensated', { params }),

  getActiveSubstances: (params: GetCnasPagedParams): Promise<ApiResponse<CnasPagedResult<CnasActiveSubstanceDto>>> =>
    api.get('/api/v1/Cnas/active-substances', { params }),

  getAtcCodes: (params: GetCnasPagedParams): Promise<ApiResponse<CnasPagedResult<CnasAtcCodeDto>>> =>
    api.get('/api/v1/Cnas/atc', { params }),

  getIcd10Codes: (params: GetCnasPagedParams): Promise<ApiResponse<CnasPagedResult<CnasIcd10Dto>>> =>
    api.get('/api/v1/Cnas/icd10', { params }),
}
