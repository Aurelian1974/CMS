/// Tipuri globale TypeScript reutilizabile în toată aplicația

/// Răspuns API paginat de la backend
export interface PagedResponse<T> {
  items: T[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  hasPreviousPage: boolean
  hasNextPage: boolean
}

/// Wrapper răspuns API de la backend
export interface ApiResponse<T> {
  success: boolean
  data: T | null
  message: string | null
  errors: Record<string, string[]> | null
}

/// Parametri comuni pentru query-uri de listare
export interface BaseListParams {
  page?: number
  pageSize?: number
  search?: string
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

/// Element nomenclator generic (id + name + code)
export interface NomenclatureItem {
  id: string
  name: string
  code: string
  isActive: boolean
}

/// DTO generat din OpenAPI cu toate câmpurile prezente (generatorul le marchează opționale
/// și nullable). Doar cheile din `Nullable` rămân `| null` — cele nullable și în C#.
export type ApiDto<T, Nullable extends keyof T = never> = {
  [P in keyof T]-?: P extends Nullable ? Exclude<T[P], undefined> : NonNullable<T[P]>
}
