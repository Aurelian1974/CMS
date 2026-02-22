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
