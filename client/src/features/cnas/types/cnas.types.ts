/// Tipuri pentru sincronizarea nomenclatoarelor CNAS

export interface CnasSyncStatusDto {
  id: string
  status: 'Running' | 'Success' | 'Failed'
  startedAt: string
  finishedAt: string | null
  nomenclatorVersion: string | null
  errorMessage: string | null
  drugsInserted: number | null
  drugsUpdated: number | null
  compensatedInserted: number | null
  compensatedUpdated: number | null
  activeSubstsInserted: number | null
  durationSeconds: number | null
}

export interface CnasSyncHistoryDto {
  id: string
  startedAt: string
  finishedAt: string | null
  status: 'Running' | 'Success' | 'Failed'
  nomenclatorVersion: string | null
  drugsInserted: number | null
  drugsUpdated: number | null
  compensatedInserted: number | null
  compensatedUpdated: number | null
  activeSubstsInserted: number | null
  durationSeconds: number | null
  triggeredBy: string | null
  errorMessage: string | null
}

export interface CnasSyncStatsDto {
  lastSyncAt: string | null
  lastSyncVersion: string | null
  lastSyncStatus: string | null
  totalDrugs: number
  activeDrugs: number
  compensatedDrugs: number
}

// ── Nomenclator — listare paginată ─────────────────────────────────────────────

export interface CnasPagedResult<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

export interface CnasDrugDto {
  code: string
  name: string
  activeSubstanceCode: string | null
  pharmaceuticalForm: string | null
  presentationMode: string | null
  concentration: string | null
  prescriptionMode: string | null
  atcCode: string | null
  company: string | null
  pricePerPackage: number | null
  isActive: boolean
  anmAuthorizationCode: string | null
  anmCommercialName: string | null
  anmCountry: string | null
  anmDispenseMode: string | null
  isInAnm: boolean
  copaymentLists: string | null
}

export interface CnasCompensatedDrugDto {
  id: number
  drugCode: string
  drugName: string
  copaymentListType: string
  nhpCode: string | null
  diseaseCode: string | null
  maxPrice: number | null
  copaymentValue: number | null
  validFrom: string | null
  validTo: string | null
  isActive: boolean
}

export interface CnasActiveSubstanceDto {
  code: string
  validFrom: string | null
}

export interface CnasAtcCodeDto {
  code: string
  description: string | null
  parentATC: string | null
}

export interface CnasIcd10Dto {
  code: string
  name: string
  diseaseCategoryCode: string | null
  validFrom: string | null
  validTo: string | null
  isActive: boolean
}

// ── Parametri query ────────────────────────────────────────────────────────────

export interface GetCnasDrugsParams {
  search?: string
  isActive?: boolean
  isCompensated?: boolean
  page: number
  pageSize: number
}

export interface GetCnasCompensatedParams {
  search?: string
  listType?: string
  page: number
  pageSize: number
}

export interface GetCnasPagedParams {
  search?: string
  page: number
  pageSize: number
}
