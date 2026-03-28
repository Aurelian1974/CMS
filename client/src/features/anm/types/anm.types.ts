/// Tipuri pentru sincronizarea și interogarea nomenclatorului ANM

export interface AnmSyncStatusDto {
  id: string
  status: 'Running' | 'Success' | 'Failed'
  startedAt: string
  finishedAt: string | null
  totalProcessed: number | null
  totalInserted: number | null
  totalUpdated: number | null
  durationSeconds: number | null
  errorMessage: string | null
}

export interface AnmSyncHistoryDto {
  id: string
  startedAt: string
  finishedAt: string | null
  status: 'Running' | 'Success' | 'Failed'
  totalProcessed: number | null
  totalInserted: number | null
  totalUpdated: number | null
  durationSeconds: number | null
  triggeredBy: string | null
  errorMessage: string | null
}

export interface AnmSyncStatsDto {
  lastSyncAt: string | null
  lastSyncStatus: string | null
  totalDrugs: number
  activeDrugs: number
}

export interface AnmDrugDto {
  authorizationCode: string
  commercialName: string
  innName: string | null
  pharmaceuticalForm: string | null
  atcCode: string | null
  company: string | null
  country: string | null
  dispenseMode: string | null
  isActive: boolean
  isCompensated: boolean
}

export interface AnmPagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface GetAnmDrugsParams {
  search?: string
  isActive?: boolean
  isCompensated?: boolean
  page: number
  pageSize: number
}
