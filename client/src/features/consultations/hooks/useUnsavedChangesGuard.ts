import { useCallback, useEffect, useRef, useState } from 'react'
import { useBlocker } from 'react-router-dom'

/**
 * Protecție împotriva pierderii datelor la părăsirea paginii:
 * - `beforeunload` (închidere tab / reload) cât timp există modificări nesalvate;
 * - navigare internă: încearcă întâi `flush()`; dacă salvarea eșuează, cere confirmare.
 */
export const useUnsavedChangesGuard = (hasUnsaved: () => boolean, isDirty: boolean, flush: () => Promise<boolean>) => {
  const hasUnsavedRef = useRef(hasUnsaved)
  hasUnsavedRef.current = hasUnsaved
  const flushRef = useRef(flush)
  flushRef.current = flush
  const [confirmLeave, setConfirmLeave] = useState(false)

  useEffect(() => {
    if (!isDirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  // Funcție stabilă care citește starea curentă la momentul navigării, nu la ultimul render
  const shouldBlock = useCallback(
    ({ currentLocation, nextLocation }: { currentLocation: { pathname: string }; nextLocation: { pathname: string } }) =>
      currentLocation.pathname !== nextLocation.pathname && hasUnsavedRef.current(),
    [],
  )
  const blocker = useBlocker(shouldBlock)

  useEffect(() => {
    if (blocker.state !== 'blocked') return
    let cancelled = false
    flushRef.current().then(ok => {
      if (cancelled) return
      if (ok) blocker.proceed()
      else setConfirmLeave(true)
    })
    return () => { cancelled = true }
  }, [blocker])

  const stay = useCallback(() => {
    setConfirmLeave(false)
    if (blocker.state === 'blocked') blocker.reset()
  }, [blocker])

  const leave = useCallback(() => {
    setConfirmLeave(false)
    if (blocker.state === 'blocked') blocker.proceed()
  }, [blocker])

  return { confirmLeave, stay, leave }
}
