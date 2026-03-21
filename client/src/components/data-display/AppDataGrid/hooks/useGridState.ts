import { useCallback, useEffect } from 'react'
import type {
  GridStateSnapshot, GridStatePersistence, NamedView,
} from '../AppDataGrid.types'

export interface UseGridStateOptions {
  statePersistence?: GridStatePersistence
  onStateChanged?: (state: GridStateSnapshot) => void

  // Current state suppliers
  getState: () => GridStateSnapshot

  // State appliers
  applyState: (state: GridStateSnapshot) => void
}

export interface UseGridStateReturn {
  saveState: () => void
  restoreState: () => void
  resetState: () => void
  saveView: (name: string) => void
  loadView: (name: string) => void
  getViews: () => NamedView[]
  deleteView: (name: string) => void
}

const VIEWS_SUFFIX = '__views'

export function useGridState(options: UseGridStateOptions): UseGridStateReturn {
  const { statePersistence, onStateChanged, getState, applyState } = options

  const storageKey = statePersistence?.gridId ?? null

  // ── Save current state to localStorage ────────────────────────────────────
  const saveState = useCallback(() => {
    if (!storageKey) return
    const state = getState()
    try {
      localStorage.setItem(storageKey, JSON.stringify(state, replacer))
    } catch (e) {
      console.error('Failed to save grid state:', e)
    }
    onStateChanged?.(state)
  }, [storageKey, getState, onStateChanged])

  // ── Restore state from localStorage ───────────────────────────────────────
  const restoreState = useCallback(() => {
    if (!storageKey) return
    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return
      const state = JSON.parse(raw, reviver) as GridStateSnapshot
      applyState(state)
    } catch (e) {
      console.error('Failed to restore grid state:', e)
    }
  }, [storageKey, applyState])

  // ── Reset to initial ──────────────────────────────────────────────────────
  const resetState = useCallback(() => {
    if (storageKey) {
      localStorage.removeItem(storageKey)
    }
    // applyState cu empty va reseta la defaults din props
    applyState({
      columns: [],
      columnOrder: [],
      sort: [],
      filter: {},
      group: [],
      page: 1,
      pageSize: 20,
    })
  }, [storageKey, applyState])

  // ── Named Views ───────────────────────────────────────────────────────────
  const getViews = useCallback((): NamedView[] => {
    if (!storageKey) return []
    try {
      const raw = localStorage.getItem(storageKey + VIEWS_SUFFIX)
      if (!raw) return []
      return JSON.parse(raw, reviver) as NamedView[]
    } catch {
      return []
    }
  }, [storageKey])

  const saveView = useCallback((name: string) => {
    if (!storageKey) return
    const state = getState()
    const views = getViews().filter(v => v.name !== name)
    views.push({ name, state, createdAt: Date.now() })
    try {
      localStorage.setItem(storageKey + VIEWS_SUFFIX, JSON.stringify(views, replacer))
    } catch (e) {
      console.error('Failed to save view:', e)
    }
  }, [storageKey, getState, getViews])

  const loadView = useCallback((name: string) => {
    const views = getViews()
    const view = views.find(v => v.name === name)
    if (view) applyState(view.state)
  }, [getViews, applyState])

  const deleteView = useCallback((name: string) => {
    if (!storageKey) return
    const views = getViews().filter(v => v.name !== name)
    try {
      localStorage.setItem(storageKey + VIEWS_SUFFIX, JSON.stringify(views, replacer))
    } catch (e) {
      console.error('Failed to delete view:', e)
    }
  }, [storageKey, getViews])

  // ── Auto-restore on mount ─────────────────────────────────────────────────
  useEffect(() => {
    if (storageKey) restoreState()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Auto-save on state change ─────────────────────────────────────────────
  // This is called externally by the grid when state changes

  return {
    saveState,
    restoreState,
    resetState,
    saveView,
    loadView,
    getViews,
    deleteView,
  }
}

// ── JSON serialization helpers for Set/Map ──────────────────────────────────

function replacer(_key: string, value: unknown): unknown {
  if (value instanceof Set) return { __type: 'Set', values: Array.from(value) }
  if (value instanceof Map) return { __type: 'Map', values: Array.from(value.entries()) }
  return value
}

function reviver(_key: string, value: unknown): unknown {
  if (value && typeof value === 'object' && '__type' in (value as Record<string, unknown>)) {
    const typed = value as { __type: string; values: unknown[] }
    if (typed.__type === 'Set') return new Set(typed.values)
    if (typed.__type === 'Map') return new Map(typed.values as [string, unknown][])
  }
  return value
}
