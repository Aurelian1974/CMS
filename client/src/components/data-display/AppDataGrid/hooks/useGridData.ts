import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import type {
  ColDef, SortModelItem, FilterModel, FilterCondition, FilterGroup,
  GroupRow, ServerSideDataSource, ServerSideRequest, TreeDataConfig,
  AggregateConfig, PaginationChangedEvent, SortChangedEvent, FilterChangedEvent,
} from '../AppDataGrid.types'
import { getColField, getNestedValue, isGroupRow } from '../AppDataGrid.types'
import { multiColumnSort, updateSortModel } from '../utils/sortUtils'
import { applyFilterOrGroup, applyQuickFilter } from '../utils/filterUtils'
import { buildGroupTree, flattenGroupTree, collectAllGroupKeys } from '../utils/groupUtils'
import { computeAggregates, flattenColumns } from '../utils/aggregateUtils'

export interface UseGridDataOptions<T extends object> {
  rowData?: T[]
  columnDefs: ColDef<T>[]
  initialSort?: SortModelItem[]
  triStateSort?: boolean
  multiSortKey?: 'ctrl' | 'shift' | 'none'
  accentedSort?: boolean
  pagination?: boolean
  pageSize?: number
  initialGroupBy?: string[]
  groupDefaultExpanded?: number
  treeData?: TreeDataConfig<T>
  aggregates?: AggregateConfig
  serverSideDataSource?: ServerSideDataSource<T>
  serverSideCount?: number
  quickFilterText?: string
  getRowId?: (data: T) => string | number
  onPaginationChanged?: (event: PaginationChangedEvent) => void
  onSortChanged?: (event: SortChangedEvent) => void
  onFilterChanged?: (event: FilterChangedEvent) => void
}

export interface UseGridDataReturn<T extends object> {
  // ── Stare ──
  allRows: T[]
  filteredRows: T[]
  displayedRows: Array<T | GroupRow<T>>
  pageRows: Array<T | GroupRow<T>>
  totalCount: number
  filteredCount: number
  page: number
  pageSize: number
  totalPages: number
  sortModel: SortModelItem[]
  filterModel: FilterModel
  quickFilterText: string
  groupFields: string[]
  expandedGroups: Set<string>
  footerAggregates: Record<string, unknown>
  loading: boolean

  // ── Acțiuni ──
  setRowData: (data: T[]) => void
  setSort: (sort: SortModelItem[]) => void
  toggleSort: (field: string, isMulti: boolean) => void
  setFilter: (field: string, condition: FilterCondition | FilterGroup | null) => void
  clearAllFilters: () => void
  setQuickFilter: (text: string) => void
  setPage: (page: number) => void
  setPageSize: (size: number) => void
  setGroupBy: (fields: string[]) => void
  toggleGroup: (groupKey: string) => void
  expandAllGroups: () => void
  collapseAllGroups: () => void
  refreshData: () => void
  getRowById: (id: string | number) => T | undefined
}

export function useGridData<T extends object>(options: UseGridDataOptions<T>): UseGridDataReturn<T> {
  const {
    columnDefs,
    initialSort = [],
    triStateSort = true,
    accentedSort = true,
    pagination = true,
    pageSize: initialPageSize = 20,
    initialGroupBy = [],
    groupDefaultExpanded = 0,
    treeData,
    aggregates,
    serverSideDataSource,
    serverSideCount,
    getRowId,
    onPaginationChanged,
    onSortChanged,
    onFilterChanged,
  } = options

  // ── State ──────────────────────────────────────────────────────────────────
  const [allRows, setAllRows] = useState<T[]>(options.rowData ?? [])
  const [sortModel, setSortModel] = useState<SortModelItem[]>(initialSort)
  const [filterModel, setFilterModel] = useState<FilterModel>({})
  const [quickFilterText, setQuickFilterText] = useState(options.quickFilterText ?? '')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [groupFields, setGroupFields] = useState<string[]>(initialGroupBy)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set())
  const [serverData, setServerData] = useState<T[]>([])
  const [serverTotal, setServerTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const isServerSide = !!serverSideDataSource
  const abortRef = useRef<AbortController | null>(null)

  // Sync rowData prop changes
  useEffect(() => {
    if (options.rowData && !isServerSide) {
      setAllRows(options.rowData)
    }
  }, [options.rowData, isServerSide])

  // Sync pageSize prop from parent (for external pagination)
  useEffect(() => {
    if (initialPageSize) setPageSize(initialPageSize)
  }, [initialPageSize])

  // ── Server-side fetch ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!isServerSide || !serverSideDataSource) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    const request: ServerSideRequest = {
      page,
      pageSize,
      sort: sortModel,
      filter: filterModel,
      group: groupFields,
      quickFilter: quickFilterText || undefined,
    }

    setLoading(true)
    serverSideDataSource(request)
      .then(response => {
        if (controller.signal.aborted) return
        setServerData(response.data)
        setServerTotal(response.totalCount)
      })
      .catch(err => {
        if (controller.signal.aborted) return
        console.error('Server-side data fetch error:', err)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })

    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isServerSide, page, pageSize, sortModel, filterModel, quickFilterText, groupFields, refreshKey])

  // ── Client-side pipeline ──────────────────────────────────────────────────

  // 1. Filter
  const filteredRows = useMemo(() => {
    if (isServerSide) return serverData
    let result = allRows

    // Apply column filters
    const filterEntries = Object.entries(filterModel)
    if (filterEntries.length > 0) {
      result = result.filter(row =>
        filterEntries.every(([, condition]) => applyFilterOrGroup(row, condition))
      )
    }

    // Apply quick filter
    if (quickFilterText) {
      const fields = flattenColumns(columnDefs)
        .filter(c => !c.excludeFromQuickFilter)
        .map(c => getColField(c))
        .filter(Boolean)
      result = result.filter(row => applyQuickFilter(row, quickFilterText, fields))
    }

    return result
  }, [allRows, filterModel, quickFilterText, columnDefs, isServerSide, serverData])

  // 2. Sort
  const sortedRows = useMemo(() => {
    if (isServerSide) return filteredRows
    return multiColumnSort(filteredRows, sortModel, columnDefs, accentedSort)
  }, [filteredRows, sortModel, columnDefs, accentedSort, isServerSide])

  // 3. Tree data
  const treeRows = useMemo(() => {
    if (!treeData || isServerSide) return sortedRows

    // Build tree structure
    const pathMap = new Map<string, { row: T; level: number; path: string[] }>()
    for (const row of sortedRows) {
      const path = treeData.getDataPath(row)
      const key = path.join('/')
      pathMap.set(key, { row, level: path.length - 1, path })
    }

    // Already flat — tree rendering is handled by display logic
    return sortedRows
  }, [sortedRows, treeData, isServerSide])

  // 4. Group
  const groupedData = useMemo((): Array<T | GroupRow<T>> => {
    if (isServerSide || !groupFields.length) return treeRows

    const tree = buildGroupTree(
      treeRows,
      groupFields,
      columnDefs,
      aggregates?.customAggFuncs,
    )

    // Auto-expand levels
    if (groupDefaultExpanded !== 0) {
      const allKeys = collectAllGroupKeys(tree)
      if (groupDefaultExpanded === -1) {
        for (const key of allKeys) expandedGroups.add(key)
      } else {
        for (const item of tree) {
          if (isGroupRow(item) && (item as GroupRow<T>).__groupLevel < groupDefaultExpanded) {
            expandedGroups.add((item as GroupRow<T>).__groupKey)
          }
        }
      }
    }

    return flattenGroupTree(tree, expandedGroups)
  }, [treeRows, groupFields, columnDefs, aggregates, groupDefaultExpanded, expandedGroups, isServerSide])

  // 5. Paginate
  const totalCount = serverSideCount != null ? serverSideCount : (isServerSide ? serverTotal : allRows.length)
  const filteredCount = serverSideCount != null ? serverSideCount : (isServerSide ? serverTotal : filteredRows.length)
  const totalPages = pagination ? Math.max(1, Math.ceil(filteredCount / pageSize)) : 1

  const isExternalPagination = serverSideCount != null

  const pageRows = useMemo(() => {
    if (!pagination) return groupedData
    if (isServerSide || isExternalPagination) return groupedData // Already paginated externally

    const start = (page - 1) * pageSize
    return groupedData.slice(start, start + pageSize)
  }, [groupedData, pagination, page, pageSize, isServerSide, isExternalPagination])

  // 6. Footer aggregates
  const footerAggregates = useMemo(() => {
    if (!aggregates?.showFooter && !aggregates?.showTotalFooter) return {}
    const rows = isServerSide ? serverData : filteredRows
    return computeAggregates(rows, columnDefs, aggregates.customAggFuncs)
  }, [aggregates, filteredRows, serverData, columnDefs, isServerSide])

  // ── Actions ───────────────────────────────────────────────────────────────

  const toggleSort = useCallback((field: string, isMulti: boolean) => {
    setSortModel(prev => {
      const next = updateSortModel(prev, field, isMulti, triStateSort)
      onSortChanged?.({ sort: next, source: 'click' })
      return next
    })
    setPage(1)
  }, [triStateSort, onSortChanged])

  const setFilterAction = useCallback((field: string, condition: FilterCondition | FilterGroup | null) => {
    setFilterModel(prev => {
      const next = { ...prev }
      if (condition === null) {
        delete next[field]
      } else {
        next[field] = condition
      }
      onFilterChanged?.({ filter: next, quickFilter: quickFilterText, source: 'ui' })
      return next
    })
    setPage(1)
  }, [onFilterChanged, quickFilterText])

  const clearAllFilters = useCallback(() => {
    setFilterModel({})
    setQuickFilterText('')
    onFilterChanged?.({ filter: {}, quickFilter: '', source: 'ui' })
    setPage(1)
  }, [onFilterChanged])

  const setGroupByAction = useCallback((fields: string[]) => {
    setGroupFields(fields)
    setExpandedGroups(new Set())
    setPage(1)
  }, [])

  const toggleGroup = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      return next
    })
  }, [])

  const expandAllGroups = useCallback(() => {
    const allKeys = collectAllGroupKeys(groupedData)
    setExpandedGroups(new Set(allKeys))
  }, [groupedData])

  const collapseAllGroups = useCallback(() => {
    setExpandedGroups(new Set())
  }, [])

  const setPageAction = useCallback((p: number) => {
    const newPage = Math.max(1, Math.min(p, totalPages))
    setPage(newPage)
    onPaginationChanged?.({
      page: newPage,
      pageSize,
      totalPages,
      totalRecords: totalCount,
    })
  }, [totalPages, pageSize, totalCount, onPaginationChanged])

  const setPageSizeAction = useCallback((size: number) => {
    setPageSize(size)
    setPage(1)
    const newTotalPages = Math.max(1, Math.ceil(totalCount / size))
    onPaginationChanged?.({
      page: 1,
      pageSize: size,
      totalPages: newTotalPages,
      totalRecords: totalCount,
    })
  }, [totalCount, onPaginationChanged])

  const refreshData = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  const getRowById = useCallback((id: string | number): T | undefined => {
    const rows = isServerSide ? serverData : allRows
    if (getRowId) {
      return rows.find(r => getRowId(r) === id)
    }
    return rows.find(r => (r as Record<string, unknown>).id === id)
  }, [allRows, serverData, isServerSide, getRowId])

  return {
    allRows,
    filteredRows,
    displayedRows: groupedData,
    pageRows,
    totalCount,
    filteredCount,
    page,
    pageSize,
    totalPages,
    sortModel,
    filterModel,
    quickFilterText,
    groupFields,
    expandedGroups,
    footerAggregates,
    loading,

    setRowData: setAllRows,
    setSort: setSortModel,
    toggleSort,
    setFilter: setFilterAction,
    clearAllFilters,
    setQuickFilter: setQuickFilterText,
    setPage: setPageAction,
    setPageSize: setPageSizeAction,
    setGroupBy: setGroupByAction,
    toggleGroup,
    expandAllGroups,
    collapseAllGroups,
    refreshData,
    getRowById,
  }
}
