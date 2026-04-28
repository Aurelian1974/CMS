/**
 * Teste unitare pentru hooks/useFeedback.ts
 * Acoperă: stare inițială, showSuccess (cu auto-clear), showError (cu Error și non-Error),
 * clearMessages, setterii direcți și mutual-exclusion între succes și eroare.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useFeedback } from '@/hooks/useFeedback'

describe('useFeedback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('stare inițială: ambele mesaje null', () => {
    const { result } = renderHook(() => useFeedback())
    expect(result.current.successMsg).toBeNull()
    expect(result.current.errorMsg).toBeNull()
  })

  it('showSuccess setează successMsg și se auto-șterge după 3 secunde', () => {
    const { result } = renderHook(() => useFeedback())

    act(() => {
      result.current.showSuccess('Salvat cu succes')
    })
    expect(result.current.successMsg).toBe('Salvat cu succes')
    expect(result.current.errorMsg).toBeNull()

    act(() => {
      vi.advanceTimersByTime(2999)
    })
    expect(result.current.successMsg).toBe('Salvat cu succes')

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current.successMsg).toBeNull()
  })

  it('showSuccess curăță un errorMsg existent', () => {
    const { result } = renderHook(() => useFeedback())

    act(() => {
      result.current.setErrorMsg('Eroare veche')
    })
    expect(result.current.errorMsg).toBe('Eroare veche')

    act(() => {
      result.current.showSuccess('OK')
    })
    expect(result.current.errorMsg).toBeNull()
    expect(result.current.successMsg).toBe('OK')
  })

  it('showError cu instanță Error folosește mesajul erorii', () => {
    const { result } = renderHook(() => useFeedback())

    act(() => {
      result.current.showError(new Error('Conexiune eșuată'))
    })
    expect(result.current.errorMsg).toBe('Conexiune eșuată')
    expect(result.current.successMsg).toBeNull()
  })

  it('showError cu valoare non-Error folosește mesajul implicit', () => {
    const { result } = renderHook(() => useFeedback())

    act(() => {
      result.current.showError('string oarecare')
    })
    expect(result.current.errorMsg).toBe('A apărut o eroare neașteptată.')

    act(() => {
      result.current.showError(null)
    })
    expect(result.current.errorMsg).toBe('A apărut o eroare neașteptată.')

    act(() => {
      result.current.showError({ code: 500 })
    })
    expect(result.current.errorMsg).toBe('A apărut o eroare neașteptată.')
  })

  it('showError curăță un successMsg existent', () => {
    const { result } = renderHook(() => useFeedback())

    act(() => {
      result.current.setSuccessMsg('Vechi succes')
    })
    expect(result.current.successMsg).toBe('Vechi succes')

    act(() => {
      result.current.showError(new Error('A picat'))
    })
    expect(result.current.successMsg).toBeNull()
    expect(result.current.errorMsg).toBe('A picat')
  })

  it('clearMessages resetează ambele mesaje', () => {
    const { result } = renderHook(() => useFeedback())

    act(() => {
      result.current.setSuccessMsg('s')
      result.current.setErrorMsg('e')
    })
    expect(result.current.successMsg).toBe('s')
    expect(result.current.errorMsg).toBe('e')

    act(() => {
      result.current.clearMessages()
    })
    expect(result.current.successMsg).toBeNull()
    expect(result.current.errorMsg).toBeNull()
  })

  it('setterii direcți (setSuccessMsg / setErrorMsg) modifică starea', () => {
    const { result } = renderHook(() => useFeedback())

    act(() => {
      result.current.setSuccessMsg('manual succ')
    })
    expect(result.current.successMsg).toBe('manual succ')

    act(() => {
      result.current.setErrorMsg('manual err')
    })
    expect(result.current.errorMsg).toBe('manual err')
  })
})
